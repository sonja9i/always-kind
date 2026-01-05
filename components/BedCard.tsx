
import React, { useState } from 'react';
import { BedData, TreatmentStatus, TreatmentType, TreatmentItem } from '../types';
import { STATUS_ORDER } from '../constants';
import { GripVertical, User, Zap, Sparkles } from 'lucide-react';

interface BedCardProps {
  bed: BedData;
  updateBed: (updates: Partial<BedData>) => void;
  updateStatus: (tid: string, status: TreatmentStatus) => void;
  updateTreatmentItem: (tid: string, updates: Partial<TreatmentItem>) => void;
  completeBed: () => void;
  addTreatment: (type: TreatmentType, time?: number) => void;
  moveToWaiting: (bedId: number, tId: string) => void;
  // useStore에서 제공하는 AI 메모 최적화 함수 추가
  refineMemoWithAI?: (bedId: number, memo: string) => Promise<void>;
}

const BedCard: React.FC<BedCardProps> = ({ 
  bed, 
  updateBed, 
  updateStatus, 
  updateTreatmentItem, 
  completeBed, 
  addTreatment, 
  moveToWaiting,
  refineMemoWithAI 
}) => {
  const [localName, setLocalName] = useState('');
  const [forceShowButtonsId, setForceShowButtonsId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const sortedTreatments = [...bed.treatments].sort((a, b) => (STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0));
  const isActive = bed.patientName !== '';
  
  const acupOptions = ['통증', '태반', '봉침', '스티커침', '천추'];
  const hotPackOptions = ['자리로', '자기장', '두타베드'];

  const handleDragStart = (e: React.DragEvent, t: TreatmentItem) => {
    const data = { bedId: bed.id, treatmentId: t.id, type: t.type };
    e.dataTransfer.setData('treatmentMove', JSON.stringify(data));
  };

  const toggleButtons = (tId: string) => {
    setForceShowButtonsId(forceShowButtonsId === tId ? null : tId);
  };

  const handleAiRefine = async () => {
    if (!refineMemoWithAI || !bed.memo) return;
    setIsAiLoading(true);
    await refineMemoWithAI(bed.id, bed.memo);
    setIsAiLoading(false);
  };

  const getStatusStyle = (status: TreatmentStatus) => {
    switch(status) {
      case '진행중': return 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-100';
      case '완료': return 'bg-blue-600 border-blue-400 text-white opacity-50 italic';
      case '안함': return 'bg-slate-900 border-slate-700 text-white opacity-40 italic';
      default: return 'bg-white border-slate-100 text-slate-800 shadow-sm';
    }
  };

  return (
    <div className={`bg-white rounded-[1.5rem] shadow-lg border-2 flex flex-col min-h-[500px] overflow-hidden transition-all duration-300 ${
      bed.isAlarming ? 'border-red-500 animate-pulse ring-4 ring-red-100 scale-[1.01]' : 'border-slate-100'
    } ${!isActive ? 'border-dashed border-slate-200 bg-slate-50/30' : ''}`}>
      
      {/* Bed Header - 갈색 */}
      <div className={`p-3 border-b flex items-center gap-2 h-14 shrink-0 ${isActive ? 'bg-[#5D4037]' : 'bg-transparent'}`}>
        <span className="text-[10px] font-black text-white bg-[#3E2723] px-2 py-1 rounded-lg shrink-0">B {bed.id}</span>
        {isActive && (
          <div className="flex flex-1 items-center gap-1.5 min-w-0 overflow-hidden">
            <input
              type="text"
              value={bed.patientName}
              onBlur={(e) => updateBed({ patientName: e.target.value })}
              className="font-black bg-transparent border-none focus:ring-0 text-white text-lg w-20 shrink-0 p-0"
            />
            <div className="h-4 w-[1px] bg-[#795548] shrink-0" />
            <input
              type="text"
              placeholder="부위"
              value={bed.area}
              onChange={(e) => updateBed({ area: e.target.value })}
              className="font-bold bg-transparent border-none focus:ring-0 text-amber-200 text-sm flex-1 min-w-0 p-0 placeholder:text-[#8D6E63] truncate"
            />
          </div>
        )}
        {isActive && (
          <button onClick={completeBed} className="px-3 py-1 bg-red-500 text-white rounded-lg text-[10px] font-black shadow hover:bg-red-600 active:scale-95">퇴실</button>
        )}
      </div>

      {isActive ? (
        <>
          {/* 메모 영역 확대 - textarea로 변경하여 자동 줄바꿈 지원 */}
          <div className="px-4 py-2 bg-amber-100/40 border-b flex items-start gap-2 h-auto shrink-0 min-h-[60px] relative group/memo">
             <Zap size={18} className="text-amber-500 shrink-0 mt-1" />
             <textarea
              placeholder="환자 특이사항/메모 입력..."
              value={bed.memo}
              rows={2}
              onChange={(e) => updateBed({ memo: e.target.value })}
              className="text-base text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-full font-black placeholder:text-slate-400 resize-none leading-tight overflow-hidden"
            />
            {/* Gemini AI Memo Refinement Button */}
            {bed.memo && bed.memo.length > 2 && (
              <button 
                onClick={handleAiRefine}
                disabled={isAiLoading}
                className={`absolute right-2 bottom-2 p-1.5 rounded-lg bg-white/80 border border-amber-200 shadow-sm text-amber-600 hover:bg-white hover:text-amber-700 transition-all opacity-0 group-hover/memo:opacity-100 ${isAiLoading ? 'animate-pulse' : ''}`}
                title="AI 메모 정리"
              >
                <Sparkles size={14} />
              </button>
            )}
          </div>

          <div className="flex-1 p-2 space-y-1 overflow-y-auto max-h-[380px] scrollbar-hide bg-white">
            {sortedTreatments.map((t) => {
              const canDrag = ['부항', '침', '추나', '소노', '충격파'].includes(t.type);
              return (
                <div
                  key={t.id}
                  draggable={canDrag}
                  onDragStart={(e) => handleDragStart(e, t)}
                  onClick={() => toggleButtons(t.id)}
                  className={`p-2 rounded-xl border transition-all relative group ${getStatusStyle(t.status)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col flex-1 min-w-0">
                      {/* 치료 타입과 부위 입력을 같은 라인(Row)으로 배치 */}
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-base tracking-tight truncate leading-none shrink-0 ${t.status !== '대기' ? 'text-white' : 'text-slate-800'}`}>
                          {t.type}
                        </span>
                        
                        {(t.type === 'ICT' || t.type === 'Ice' || t.type === '소노' || t.type === '충격파') && (
                           <input 
                             onClick={(e) => e.stopPropagation()}
                             value={t.ictArea || t.customArea || ''}
                             onChange={(e) => updateTreatmentItem(t.id, { ictArea: e.target.value, customArea: e.target.value })}
                             placeholder="부위 입력"
                             className={`text-xs font-black flex-1 min-w-0 bg-black/5 border-none rounded px-2 py-0.5 focus:bg-white/20 transition-all ${t.status !== '대기' ? 'text-white placeholder:text-white/40' : 'text-slate-700 placeholder:text-slate-400'}`}
                           />
                         )}
                         
                        {t.status === '진행중' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />}
                      </div>
                      
                      <div className="flex gap-1.5 mt-1 overflow-hidden">
                         {t.type === '부항' && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); updateTreatmentItem(t.id, { isWet: !t.isWet }); }}
                             className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all shrink-0 ${t.isWet ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                           >습부</button>
                         )}
                      </div>

                      {(t.type === '소노' || t.type === '충격파') && t.status === '대기' && (
                        <div className="flex gap-1 mt-1">
                          {[330, 600].map(time => (
                            <button
                              key={time}
                              onClick={(e) => { e.stopPropagation(); updateTreatmentItem(t.id, { totalTime: time, remainingTime: time }); }}
                              className={`px-1.5 py-0.5 text-[8px] font-black rounded border transition-all ${
                                t.totalTime === time ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-400 border-slate-100'
                              }`}
                            >
                              {time === 330 ? '5:30' : '10분'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {t.status === '진행중' && forceShowButtonsId !== t.id ? (
                        <span className="text-lg font-mono font-black text-white drop-shadow-sm">
                          {t.type === '추나' ? formatTime(t.elapsedTime) : formatTime(t.remainingTime)}
                        </span>
                      ) : null}

                      {(t.status !== '진행중' || forceShowButtonsId === t.id) && (
                        <div className="flex gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(t.id, '진행중'); setForceShowButtonsId(null); }} 
                            className={`px-2 py-1 rounded-lg text-[9px] font-black shadow-sm transition-all ${t.status === '진행중' ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-white'}`}
                          >시작</button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(t.id, '완료'); setForceShowButtonsId(null); }} 
                            className={`px-2 py-1 rounded-lg text-[9px] font-black shadow-sm transition-all ${t.status === '완료' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}`}
                          >완료</button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(t.id, '안함'); setForceShowButtonsId(null); }} 
                            className={`px-2 py-1 rounded-lg text-[9px] font-black shadow-sm transition-all ${t.status === '안함' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}
                          >안함</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 세부 옵션 */}
                  {t.status === '대기' && (
                    <div className="mt-1 pt-1 border-t border-slate-100 flex flex-wrap gap-1">
                      {t.type === '침' && acupOptions.map(opt => (
                        <button key={opt} onClick={(e) => { e.stopPropagation(); updateTreatmentItem(t.id, { subOption: opt === t.subOption ? undefined : opt }); }} 
                          className={`px-1.5 py-0.5 text-[8px] rounded font-bold border transition-all ${t.subOption === opt ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                          {opt}
                        </button>
                      ))}
                      {t.type === '핫팩' && hotPackOptions.map(opt => (
                        <button key={opt} onClick={(e) => { e.stopPropagation(); updateTreatmentItem(t.id, { subOption: opt === t.subOption ? undefined : opt }); }} 
                          className={`px-1.5 py-0.5 text-[8px] rounded font-bold border transition-all ${t.subOption === opt ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {canDrag && (
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-20 transition-opacity">
                       <GripVertical size={10} className={t.status !== '대기' ? 'text-white' : 'text-slate-400'} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-2 border-t bg-slate-50 flex flex-wrap gap-1 justify-center shrink-0">
            {['Ice', '추나', '소노', '충격파'].map(type => (
              <button key={type} onClick={() => addTreatment(type as any)} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[8px] font-black text-slate-600 hover:border-emerald-500 transition-all">+ {type}</button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4 border-2 border-dashed border-slate-100">
             <User size={20} className="text-slate-100" />
           </div>
           <form onSubmit={(e) => { e.preventDefault(); if(localName.trim()) { updateBed({ patientName: localName.trim() }); setLocalName(''); } }} className="w-full">
             <input
                type="text"
                placeholder="환자 성함"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full h-10 rounded-xl border-2 border-slate-50 text-base font-black text-slate-900 focus:ring-0 focus:border-emerald-500 transition-all text-center"
             />
           </form>
        </div>
      )}
    </div>
  );
};

export default BedCard;
