
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { WaitingPatient, WaitType } from '../types';
import { UserPlus, Clock, Trash2, Search, Activity, Timer } from 'lucide-react';

interface WaitingAreaProps { store: ReturnType<typeof useStore>; }

const WaitingArea: React.FC<WaitingAreaProps> = ({ store }) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<WaitType>('상담');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const diff = Math.floor((now.getTime() - start) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const types: WaitType[] = ['상담', '재진', '소노', '충격파'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      store.addWaitingPatient(newName.trim(), newType);
      setNewName('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* 접수 영역 */}
      <div className="p-4 border-b border-slate-200 bg-white shrink-0 shadow-sm">
        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
          <UserPlus size={14} className="text-emerald-500" /> 상담/대기 접수
        </h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="환자 성함 입력 후 엔터" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              className="w-full pl-9 pr-3 py-2 border-2 border-slate-100 rounded-xl text-sm focus:ring-0 focus:border-emerald-500 transition-all font-bold" 
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-300" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            {types.map((t) => (
              <button 
                key={t} 
                type="button" 
                onClick={() => setNewType(t)} 
                className={`text-[10px] py-1.5 rounded-lg border-2 transition-all font-bold ${newType === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* 대기 명단 영역 */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2 sticky top-0 bg-slate-50 py-1 z-10">
          <Clock size={14} className="text-amber-500" /> 일반 대기 명단 ({store.state.waitingList.length})
        </h2>
        <div className="space-y-3">
          {store.state.waitingList.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl py-10 flex flex-col items-center justify-center opacity-30">
               <Clock size={24} className="mb-2" />
               <p className="text-[10px] font-black uppercase text-center leading-tight">대기 중인<br/>환자가 없습니다</p>
            </div>
          ) : (
            store.state.waitingList.map((p) => (
              <div key={p.id} draggable onDragStart={(e) => e.dataTransfer.setData('patientId', p.id)} className="bg-white p-4 rounded-[1.25rem] border-2 border-slate-100 shadow-sm cursor-grab hover:border-emerald-400 transition-all active:scale-[0.98]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-base leading-none">{p.name}</span>
                    {/* 소노/충격파 설정 시간 표시 */}
                    {(p.type === '소노' || p.type === '충격파') && p.treatmentData && (
                      <div className="flex items-center gap-1 mt-1.5 bg-purple-50 px-2 py-0.5 rounded-md w-fit border border-purple-100">
                        <Timer size={10} className="text-purple-600" />
                        <span className="text-[9px] font-black text-purple-700">
                          {p.treatmentData.totalTime === 330 ? '5분 30초' : '10분'} 치료
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-amber-600 font-mono font-black bg-amber-50 px-2 py-0.5 rounded-lg">{getElapsedTime(p.arrivalTime)}</span>
                </div>
                
                <div className="flex flex-col gap-2 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 items-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black ${p.type === '소노' || p.type === '충격파' ? 'bg-purple-600 text-white shadow-sm' : 'bg-blue-100 text-blue-700'}`}>{p.type}</span>
                      {p.treatmentData && (
                        <div className="flex items-center gap-1.5">
                          {p.treatmentData.status === '진행중' && (
                            <span className="text-[11px] font-mono font-black bg-emerald-600 text-white px-2 py-0.5 rounded-lg shadow-sm animate-pulse">
                              {formatTime(p.treatmentData.remainingTime)}
                            </span>
                          )}
                          {p.treatmentData.status === '완료' && (
                            <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">완료</span>
                          )}
                        </div>
                      )}
                    </div>
                    <button onClick={() => store.removeFromWaiting(p.id)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>

                  {/* 소노/충격파 환자 대기 중 시간 설정 버튼 */}
                  {(p.type === '소노' || p.type === '충격파') && p.treatmentData && (
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex gap-1">
                        {[330, 600].map(time => (
                          <button
                            key={time}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              store.updateTreatmentItem(0, p.id, { totalTime: time, remainingTime: time }); 
                            }}
                            className={`flex-1 py-1 text-[9px] font-black rounded-lg border-2 transition-all ${
                              p.treatmentData?.totalTime === time ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-100 text-slate-400'
                            }`}
                          >
                            {time === 330 ? '5:30' : '10분'}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); store.updateWaitingTreatmentStatus(p.id, '진행중'); }}
                          className={`flex-1 py-1.5 rounded-xl text-[10px] font-black shadow-sm transition-all ${p.treatmentData.status === '진행중' ? 'bg-white text-emerald-600 border border-emerald-500' : 'bg-emerald-500 text-white'}`}
                        >시작</button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); store.updateWaitingTreatmentStatus(p.id, '완료'); }}
                          className={`flex-1 py-1.5 rounded-xl text-[10px] font-black shadow-sm transition-all ${p.treatmentData.status === '완료' ? 'bg-white text-blue-600 border border-blue-500' : 'bg-blue-500 text-white'}`}
                        >완료</button>
                      </div>
                    </div>
                  )}

                  {(p.treatmentData?.ictArea || p.memo) && (
                    <div className="flex items-start gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-50 p-2 rounded-xl border border-slate-100">
                       <Activity size={12} className="shrink-0 mt-0.5 text-slate-300" /> 
                       <span className="line-clamp-2">{p.treatmentData?.ictArea || p.memo}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default WaitingArea;
