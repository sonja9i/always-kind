
import React, { useState } from 'react';
import { useStore } from './store';
import Dashboard from './components/Dashboard';
import HistoryView from './components/HistoryView';
import SettingsModal from './components/SettingsModal';
import { LayoutDashboard, History, PlusCircle, Wifi, WifiOff, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const store = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-emerald-600 text-white p-1.5 rounded-lg">
              <LayoutDashboard size={20} />
            </span>
            한의원 치료 현황판
          </h1>
          <nav className="flex ml-8 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard size={18} />
              현황판
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <History size={18} />
              치료 내역
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={store.addBed}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-100"
          >
            <PlusCircle size={18} />
            베드 추가
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className={`flex items-center gap-2 text-xs font-black transition-colors ${store.isSynced ? 'text-emerald-600' : 'text-amber-500'}`}>
              {store.isSynced ? <Wifi size={14} className="animate-pulse" /> : <WifiOff size={14} />}
              {store.isSynced ? '실시간 공유 중' : '로컬 모드'}
            </div>
            
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              title="연결 설정"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' ? (
          <Dashboard store={store} />
        ) : (
          <HistoryView history={store.state.history} />
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onSave={(config) => {
            store.saveFbConfig(config);
            setIsSettingsOpen(false);
          }}
          currentConfig={store.fbConfig}
        />
      )}
    </div>
  );
};

export default App;
