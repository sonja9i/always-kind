
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, BedData, WaitingPatient, TreatmentHistory, TreatmentItem, TreatmentStatus, TreatmentType, DirectorTask } from './types';
import { INITIAL_BED_COUNT, TREATMENT_TIMES, DEFAULT_TREATMENTS } from './constants';
import { initializeApp, getApp, getApps } from 'firebase/app';
import * as database from 'firebase/database';
import { GoogleGenAI } from "@google/genai";

const { getDatabase, ref, onValue, set, off } = database;

const STORAGE_KEY = 'hanyui_clinic_state_v15';
const FB_CONFIG_KEY = 'hanyui_firebase_config';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const getStoredFbConfig = (): FirebaseConfig | null => {
  const saved = localStorage.getItem(FB_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const getFirebaseDb = (config: FirebaseConfig | null) => {
  if (!config || !config.apiKey || config.apiKey === "YOUR_API_KEY") return null;
  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    return getDatabase(app);
  } catch (e) {
    console.error("Firebase Init Error:", e);
    return null;
  }
};

const getInitialLocalState = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse state", e);
    }
  }

  const initialBeds: BedData[] = Array.from({ length: INITIAL_BED_COUNT }, (_, i) => ({
    id: i + 1,
    patientName: '',
    memo: '',
    area: '',
    treatments: [],
  }));

  return {
    beds: initialBeds,
    waitingList: [],
    directorQueue: [],
    history: []
  };
};

export const useStore = () => {
  const [state, setState] = useState<AppState>(getInitialLocalState());
  const [fbConfig, setFbConfig] = useState<FirebaseConfig | null>(getStoredFbConfig());
  const [isSynced, setIsSynced] = useState(false);
  const isUpdatingFromRemote = useRef(false);

  // Firebase 설정 저장 함수
  const saveFbConfig = (config: FirebaseConfig) => {
    localStorage.setItem(FB_CONFIG_KEY, JSON.stringify(config));
    setFbConfig(config);
    // 페이지 새로고침을 통해 깨끗하게 재연결 유도
    window.location.reload();
  };

  // Firebase 실시간 구독
  useEffect(() => {
    const db = getFirebaseDb(fbConfig);
    if (!db) {
      setIsSynced(false);
      return;
    }

    const stateRef = ref(db, 'clinic_state');
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        isUpdatingFromRemote.current = true;
        setState(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setIsSynced(true);
        setTimeout(() => { isUpdatingFromRemote.current = false; }, 100);
      }
    }, (error) => {
      console.error("Firebase Sync Error:", error);
      setIsSynced(false);
    });

    return () => off(stateRef);
  }, [fbConfig]);

  const saveState = useCallback((newState: AppState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

    const db = getFirebaseDb(fbConfig);
    if (!isUpdatingFromRemote.current && db) {
      try {
        set(ref(db, 'clinic_state'), newState);
      } catch (e) {
        console.error("Firebase Save Error:", e);
        setIsSynced(false);
      }
    }
  }, [fbConfig]);

  const refineMemoWithAI = async (bedId: number, currentMemo: string) => {
    if (!currentMemo || currentMemo.trim().length < 2) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `다음은 한의원 환자의 메모입니다. 이를 전문적이고 간결한 의학 용어(한의학 중심)로 요약해서 다시 써줘. (최대 20자 내외): "${currentMemo}"`,
      });
      const refinedText = response.text;
      if (refinedText) {
        updateBed(bedId, { memo: refinedText.trim() });
      }
    } catch (e) { console.error("AI Memo Refine Error:", e); }
  };

  const playAlarmSound = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      gain.gain.setValueAtTime(0.1, context.currentTime);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.5);
    } catch (e) {}
  };

  const createDefaultTreatments = (): TreatmentItem[] => {
    return DEFAULT_TREATMENTS.map(type => ({
      id: crypto.randomUUID(),
      type,
      status: '대기',
      remainingTime: TREATMENT_TIMES[type] || 600,
      totalTime: TREATMENT_TIMES[type] || 600,
      elapsedTime: 0,
    }));
  };

  const updateBed = (bedId: number, updates: Partial<BedData>) => {
    const newBeds = state.beds.map(bed => {
      if (bed.id === bedId) {
        if (updates.patientName && !bed.patientName) {
          return { ...bed, ...updates, treatments: createDefaultTreatments(), area: '', memo: '' };
        }
        return { ...bed, ...updates };
      }
      return bed;
    });
    saveState({ ...state, beds: newBeds });
  };

  const updateTreatmentStatus = (bedId: number, treatmentId: string, requestedStatus: TreatmentStatus) => {
    let shouldRemove = false;
    const newBeds = state.beds.map(bed => {
      if (bed.id === bedId) {
        let newTreatments = bed.treatments.map(t => {
          if (t.id === treatmentId) {
            let finalStatus = requestedStatus;
            if (t.status === '완료' && requestedStatus === '완료') finalStatus = '대기';
            if (t.status === '안함' && requestedStatus === '안함') finalStatus = '대기';
            if (finalStatus === '진행중') return { ...t, status: finalStatus, isFinished: false };
            if (finalStatus === '완료' || finalStatus === '안함' || finalStatus === '대기') {
              if (finalStatus === '안함' && !DEFAULT_TREATMENTS.includes(t.type)) { shouldRemove = true; return t; }
              return { ...t, status: finalStatus, remainingTime: t.totalTime, elapsedTime: 0, isFinished: false };
            }
            return { ...t, status: finalStatus, isFinished: false };
          }
          return t;
        });
        if (shouldRemove) newTreatments = newTreatments.filter(t => t.id !== treatmentId);
        return { ...bed, treatments: newTreatments };
      }
      return bed;
    });
    let newQueue = state.directorQueue;
    const isNowRunning = newBeds.some(b => b.id === bedId && b.treatments.some(t => t.id === treatmentId && t.status === '진행중'));
    if (isNowRunning || shouldRemove) {
      newQueue = state.directorQueue.filter(q => q.treatmentId !== treatmentId);
    }
    saveState({ ...state, beds: newBeds, directorQueue: newQueue });
  };

  const updateWaitingTreatmentStatus = (patientId: string, requestedStatus: TreatmentStatus) => {
    const newWaitingList = state.waitingList.map(p => {
      if (p.id === patientId && p.treatmentData) {
        let finalStatus = requestedStatus;
        if (p.treatmentData.status === '완료' && requestedStatus === '완료') finalStatus = '대기';
        return {
          ...p,
          treatmentData: {
            ...p.treatmentData,
            status: finalStatus,
            isFinished: false,
            remainingTime: (finalStatus === '완료' || finalStatus === '대기') ? p.treatmentData.totalTime : p.treatmentData.remainingTime
          }
        };
      }
      return p;
    });
    saveState({ ...state, waitingList: newWaitingList });
  };

  const updateTreatmentItem = (bedId: number, treatmentId: string, updates: Partial<TreatmentItem>) => {
    if (bedId === 0) {
      const newWaiting = state.waitingList.map(p => {
        if (p.id === treatmentId && p.treatmentData) return { ...p, treatmentData: { ...p.treatmentData, ...updates } };
        return p;
      });
      saveState({ ...state, waitingList: newWaiting });
      return;
    }
    const newBeds = state.beds.map(bed => {
      if (bed.id === bedId) {
        const newTreatments = bed.treatments.map(t => t.id === treatmentId ? { ...t, ...updates } : t);
        return { ...bed, treatments: newTreatments };
      }
      return bed;
    });
    saveState({ ...state, beds: newBeds });
  };

  const addTreatmentToBed = (bedId: number, type: TreatmentType, time?: number) => {
    const newBeds = state.beds.map(bed => {
      if (bed.id === bedId) {
        if (bed.treatments.some(t => t.type === type)) return bed;
        const total = time || (TREATMENT_TIMES[type] || 600);
        const newItem: TreatmentItem = { id: crypto.randomUUID(), type, status: '대기', remainingTime: total, totalTime: total, elapsedTime: 0 };
        return { ...bed, treatments: [...bed.treatments, newItem] };
      }
      return bed;
    });
    saveState({ ...state, beds: newBeds });
  };

  const moveToDirectorQueue = (bedId: number, treatmentId: string) => {
    const bed = state.beds.find(b => b.id === bedId);
    const treatment = bed?.treatments.find(t => t.id === treatmentId);
    if (!bed || !treatment) return;
    if (!['부항', '침', '추나'].includes(treatment.type)) return;
    if (state.directorQueue.some(q => q.treatmentId === treatmentId)) return;
    const newTask: DirectorTask = { id: crypto.randomUUID(), bedId: bed.id, patientName: bed.patientName, treatmentType: treatment.type, treatmentId: treatment.id, timestamp: new Date().toISOString(), subOption: treatment.subOption, isWet: treatment.isWet };
    saveState({ ...state, directorQueue: [...state.directorQueue, newTask] });
  };

  const removeFromDirectorQueue = (taskId: string) => {
    const task = state.directorQueue.find(q => q.id === taskId);
    if (task) updateTreatmentStatus(task.bedId, task.treatmentId, '진행중');
    saveState({ ...state, directorQueue: state.directorQueue.filter(q => q.id !== taskId) });
  };

  const moveToWaiting = (bedId: number, treatmentId: string) => {
    const bed = state.beds.find(b => b.id === bedId);
    const treatment = bed?.treatments.find(t => t.id === treatmentId);
    if (!bed || !treatment) return;
    const newPatient: WaitingPatient = { id: crypto.randomUUID(), name: bed.patientName, type: treatment.type as any, arrivalTime: new Date().toISOString(), treatmentData: { ...treatment }, memo: bed.memo };
    let newBeds = state.beds;
    if (!['소노', '충격파'].includes(treatment.type)) { newBeds = state.beds.map(b => b.id === bedId ? { ...b, treatments: b.treatments.filter(t => t.id !== treatmentId) } : b); }
    saveState({ ...state, waitingList: [...state.waitingList, newPatient], beds: newBeds, directorQueue: state.directorQueue.filter(q => q.treatmentId !== treatmentId) });
  };

  const addWaitingPatient = (name: string, type: any) => {
    let treatmentData: TreatmentItem | undefined;
    if (type === '소노' || type === '충격파') {
       treatmentData = { id: crypto.randomUUID(), type: type as TreatmentType, status: '대기', remainingTime: 600, totalTime: 600, elapsedTime: 0 };
    }
    const newPatient: WaitingPatient = { id: crypto.randomUUID(), name, type, arrivalTime: new Date().toISOString(), treatmentData };
    saveState({ ...state, waitingList: [...state.waitingList, newPatient] });
  };

  const completeBed = (bedId: number) => {
    const bed = state.beds.find(b => b.id === bedId);
    if (bed && bed.patientName) {
      const hist: TreatmentHistory = { id: crypto.randomUUID(), patientName: bed.patientName, area: bed.area, memo: bed.memo, completedAt: new Date().toISOString(), treatments: bed.treatments.map(t => ({ ...t })) };
      saveState({ ...state, history: [hist, ...state.history].slice(0, 5000), beds: state.beds.map(b => b.id === bedId ? { ...b, patientName: '', area: '', memo: '', treatments: [], isAlarming: false } : b), directorQueue: state.directorQueue.filter(q => q.bedId !== bedId) });
    } else {
      saveState({ ...state, beds: state.beds.map(b => b.id === bedId ? { ...b, patientName: '', area: '', memo: '', treatments: [], isAlarming: false } : b), directorQueue: state.directorQueue.filter(q => q.bedId !== bedId) });
    }
  };

  const addBed = () => {
    const nextId = state.beds.length > 0 ? Math.max(...state.beds.map(b => b.id)) + 1 : 1;
    saveState({ ...state, beds: [...state.beds, { id: nextId, patientName: '', memo: '', area: '', treatments: [] }] });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        let changed = false;
        const newBeds = prev.beds.map(bed => {
          let bedAlarming = bed.isAlarming;
          const newTreatments = bed.treatments.map(t => {
            if (t.status === '진행중') {
              if (t.type === '추나') { changed = true; return { ...t, elapsedTime: t.elapsedTime + 1 }; }
              else if (t.remainingTime > 0) {
                changed = true;
                const nextTime = t.remainingTime - 1;
                if (nextTime === 0) { playAlarmSound(); bedAlarming = true; setTimeout(() => { setState(current => ({ ...current, beds: current.beds.map(b => b.id === bed.id ? { ...b, isAlarming: false } : b) })); }, 5000); return { ...t, remainingTime: 0, status: '완료' as const, isFinished: true }; }
                return { ...t, remainingTime: nextTime };
              }
            }
            return t;
          });
          return { ...bed, treatments: newTreatments, isAlarming: bedAlarming };
        });
        const newWaitingList = prev.waitingList.map(p => {
          if (p.treatmentData && p.treatmentData.status === '진행중') {
            if (p.treatmentData.remainingTime > 0) { changed = true; return { ...p, treatmentData: { ...p.treatmentData, remainingTime: p.treatmentData.remainingTime - 1 } }; }
            else if (p.treatmentData.remainingTime === 0 && !p.treatmentData.isFinished) { playAlarmSound(); changed = true; return { ...p, treatmentData: { ...p.treatmentData, status: '완료' as const, isFinished: true } }; }
          }
          return p;
        });
        if (changed) return { ...prev, beds: newBeds, waitingList: newWaitingList };
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { state, isSynced, fbConfig, saveFbConfig, updateBed, updateTreatmentStatus, updateWaitingTreatmentStatus, updateTreatmentItem, addTreatmentToBed, completeBed, addWaitingPatient, moveToWaiting, moveToDirectorQueue, removeFromDirectorQueue, addBed, refineMemoWithAI, removeFromWaiting: (id: string) => saveState({ ...state, waitingList: state.waitingList.filter(p => p.id !== id) }), assignToBed: (pId: string, bedId: number) => {
    const p = state.waitingList.find(x => x.id === pId);
    if (p) {
      const newBeds = state.beds.map(bed => {
        if (bed.id === bedId) {
          let treatments: TreatmentItem[];
          const defaultTreatments = createDefaultTreatments();
          if (p.treatmentData) {
            if (['소노', '충격파'].includes(p.treatmentData.type)) treatments = [...defaultTreatments, { ...p.treatmentData, ictArea: p.treatmentData.ictArea || p.memo || '' }];
            else treatments = [p.treatmentData];
          } else treatments = defaultTreatments;
          return { ...bed, patientName: p.name, treatments, area: p.treatmentData?.ictArea || bed.area || '', memo: p.memo || bed.memo || '' };
        }
        return bed;
      });
      saveState({ ...state, beds: newBeds, waitingList: state.waitingList.filter(x => x.id !== pId) });
    }
  }};
};
