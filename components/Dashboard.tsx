
import React from 'react';
import { useStore } from '../store';
import WaitingArea from './WaitingArea';
import BedCard from './BedCard';
import DirectorQueueCard from './DirectorQueueCard';

interface DashboardProps {
  store: ReturnType<typeof useStore>;
}

const Dashboard: React.FC<DashboardProps> = ({ store }) => {
  const handleDropToBed = (e: React.DragEvent, bedId: number) => {
    e.preventDefault();
    const patientId = e.dataTransfer.getData('patientId');
    if (patientId) {
      store.assignToBed(patientId, bedId);
    }
  };

  const handleDropToDirectorInSidebar = (e: React.DragEvent) => {
    e.preventDefault();
    const moveData = e.dataTransfer.getData('treatmentMove');
    if (moveData) {
      const { bedId, treatmentId, type } = JSON.parse(moveData);
      if (['부항', '침', '추나'].includes(type)) {
        store.moveToDirectorQueue(bedId, treatmentId);
      } else {
        alert("원장 치료 순서에는 부항, 침, 추나만 추가할 수 있습니다.");
      }
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-slate-100">
      {/* 왼쪽 사이드바: 상담/대기(상단) + 원장 치료 순서(하단) */}
      <aside className="w-80 flex flex-col h-full bg-white border-r border-slate-200 shadow-xl z-10">
        
        {/* 상단: 상담/대기 명단 (높이를 첫 번째 열 베드 높이인 500px + 간격 32px 정도로 맞춤) */}
        <div className="h-[532px] overflow-hidden border-b border-slate-100">
          <WaitingArea store={store} />
        </div>

        {/* 하단: 원장 치료 순서 (두 번째 열 베드 상단 높이부터 시작) */}
        <div 
          className="flex-1 overflow-hidden"
          onDrop={handleDropToDirectorInSidebar}
          onDragOver={(e) => e.preventDefault()}
        >
          <DirectorQueueCard store={store} />
        </div>
      </aside>

      {/* 메인 섹션: 베드 현황 그리드 */}
      <section className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
          {store.state.beds.map((bed) => (
            <div
              key={bed.id}
              onDrop={(e) => handleDropToBed(e, bed.id)}
              onDragOver={(e) => e.preventDefault()}
              className="h-full"
            >
              <BedCard
                bed={bed}
                updateBed={(updates) => store.updateBed(bed.id, updates)}
                updateStatus={(tid, status) => store.updateTreatmentStatus(bed.id, tid, status)}
                updateTreatmentItem={(tid, updates) => store.updateTreatmentItem(bed.id, tid, updates)}
                completeBed={() => store.completeBed(bed.id)}
                addTreatment={(type, time) => store.addTreatmentToBed(bed.id, type, time)}
                moveToWaiting={(bid, tid) => store.moveToWaiting(bid, tid)}
                refineMemoWithAI={store.refineMemoWithAI}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
