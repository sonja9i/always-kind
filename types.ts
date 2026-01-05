
export type TreatmentType = 'ICT' | '부항' | '침' | '핫팩' | 'Ice' | '추나' | '소노' | '충격파';
export type WaitType = '상담' | '재진' | '소노' | '충격파';
export type TreatmentStatus = '대기' | '진행중' | '완료' | '안함';

export interface TreatmentItem {
  id: string;
  type: TreatmentType;
  status: TreatmentStatus;
  remainingTime: number; 
  totalTime: number;
  elapsedTime: number; // 추나용 경과 시간
  subOption?: string; 
  isWet?: boolean;    
  ictArea?: string;   
  customArea?: string; 
  intensity?: string;  
  isFinished?: boolean; // 알람용 상태
}

export interface BedData {
  id: number;
  patientName: string;
  memo: string;
  area: string;
  treatments: TreatmentItem[];
  startTime?: string;
  isAlarming?: boolean; // 베드 전체 알람 상태
}

export interface WaitingPatient {
  id: string;
  name: string;
  type: WaitType | TreatmentType;
  arrivalTime: string;
  bedId?: number;
  // 소노/충격파 이동 시 기존 치료 데이터를 보존하기 위함
  treatmentData?: TreatmentItem;
  memo?: string;
}

export interface DirectorTask {
  id: string;
  bedId: number;
  patientName: string;
  treatmentType: TreatmentType;
  treatmentId: string;
  timestamp: string;
  subOption?: string; // 침 종류 등 보존
  isWet?: boolean;    // 습부 여부 보존
}

export interface TreatmentHistory {
  id: string;
  patientName: string;
  area: string;
  memo: string;
  completedAt: string;
  treatments: {
    type: TreatmentType;
    status: TreatmentStatus;
    subOption?: string;
    isWet?: boolean;
    ictArea?: string;
    customArea?: string;
    intensity?: string;
  }[];
}

export interface AppState {
  beds: BedData[];
  waitingList: WaitingPatient[];
  directorQueue: DirectorTask[];
  history: TreatmentHistory[];
}
