
import React, { useState, useMemo } from 'react';
import { TreatmentHistory } from '../types';
import { Clock, User, ClipboardCheck, Activity, Zap, Search, Calendar } from 'lucide-react';

interface HistoryViewProps {
  history: TreatmentHistory[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ history }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredHistory = useMemo(() => {
    return history.filter((record) => {
      const matchName = record.patientName.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchDate = true;
      if (startDate || endDate) {
        const recordDate = new Date(record.completedAt);
        recordDate.setHours(0, 0, 0, 0);
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (recordDate < start) matchDate = false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          if (recordDate > end) matchDate = false;
        }
      }
      
      return matchName && matchDate;
    });
  }, [history, searchTerm, startDate, endDate]);

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto scrollbar-hide">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">전체 치료 내역</h2>
            <p className="text-slate-500 text-sm">기록된 치료 내역을 검색하고 확인하세요.</p>
          </div>
          <div className="bg-emerald-600 text-white px-6 py-2 rounded-2xl shadow-lg font-black text-sm">
            검색 결과: {filteredHistory.length} 건
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="환자 이름 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>
          <div className="relative flex items-center gap-2">
            <Calendar className="text-slate-400 shrink-0" size={18} />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-bold"
            />
            <span className="text-slate-300">~</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>
          <div className="flex justify-end items-center">
            <button 
              onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); }}
              className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
            >
              필터 초기화
            </button>
          </div>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck size={32} />
          </div>
          <p className="text-slate-400 font-bold">일치하는 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredHistory.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all flex items-start gap-6 border-l-8 border-l-emerald-500">
              <div className="bg-slate-100 p-4 rounded-2xl text-slate-600 shrink-0 shadow-inner">
                <Clock size={28} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-slate-900">{record.patientName}</span>
                    <span className="flex items-center gap-1.5 text-sm bg-emerald-50 px-3 py-1 rounded-xl text-emerald-700 font-black border border-emerald-100">
                       <Activity size={14} /> {record.area || '부위 미기입'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-black bg-slate-50 px-3 py-1 rounded-lg">
                    {new Date(record.completedAt).toLocaleString('ko-KR', { 
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                {record.memo && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-xl text-sm text-slate-600 font-medium">
                        <Zap size={14} className="text-amber-500" /> {record.memo}
                    </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {record.treatments.map((t, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col gap-1 p-3 rounded-2xl border ${
                        t.status === '완료' ? 'bg-emerald-50 border-emerald-200' :
                        t.status === '안함' ? 'bg-red-50 border-red-100' :
                        'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-black text-slate-800">{t.type}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-black ${
                            t.status === '완료' ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'
                        }`}>{t.status}</span>
                      </div>
                      {(t.subOption || t.ictArea || t.customArea || t.intensity) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.subOption && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">{t.subOption}</span>}
                          {t.isWet && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">습부</span>}
                          {t.ictArea && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{t.ictArea}</span>}
                          {t.customArea && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">{t.customArea}</span>}
                          {t.intensity && <span className="text-[10px] bg-slate-700 text-white px-1.5 py-0.5 rounded font-bold">강도: {t.intensity}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
