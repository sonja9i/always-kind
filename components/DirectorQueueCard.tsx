
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { UserCheck, Clock, CheckCircle2 } from 'lucide-react';

interface DirectorQueueCardProps {
  store: ReturnType<typeof useStore>;
}

const DirectorQueueCard: React.FC<DirectorQueueCardProps> = ({ store }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const diff = Math.floor((now.getTime() - start) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F1FF]">
      {/* Header */}
      <div className="p-4 border-b border-purple-200 bg-purple-700 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <UserCheck size={18} className="text-white" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider">원장 치료 순서</h2>
        </div>
        <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          {store.state.directorQueue.length}명 대기
        </span>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {store.state.directorQueue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-purple-400">
            <Clock size={32} strokeWidth={1.5} className="mb-2" />
            <p className="text-[10px] font-black text-center leading-tight">
              베드에서 항목을<br/>이곳으로 드래그하세요
            </p>
          </div>
        ) : (
          store.state.directorQueue.map((task) => (
            <div key={task.id} className="bg-white p-3 rounded-2xl border-2 border-purple-100 shadow-sm animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">B{task.bedId}</span>
                  <span className="text-sm font-black text-slate-800">{task.patientName}</span>
                </div>
                <span className="text-[10px] font-mono font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">
                  {getElapsedTime(task.timestamp)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-lg uppercase">
                  {task.treatmentType}
                </span>
                {task.isWet && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-black">습부</span>}
                {task.subOption && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md font-black">{task.subOption}</span>}
              </div>

              <button 
                onClick={() => store.removeFromDirectorQueue(task.id)}
                className="w-full py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-black shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={12} /> 치료 시작
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DirectorQueueCard;
