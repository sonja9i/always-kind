import React, { useState } from 'react';
import { X, Save, HelpCircle } from 'lucide-react';
import { FirebaseConfig } from '../store';

interface SettingsModalProps {
  onClose: () => void;
  onSave: (config: FirebaseConfig) => void;
  currentConfig: FirebaseConfig | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSave, currentConfig }) => {
  const [config, setConfig] = useState<FirebaseConfig>(
    currentConfig || {
      apiKey: '',
      authDomain: '',
      databaseURL: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
              <Save size={18} />
            </span>
            Firebase 연결 설정
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 본문 (스크롤 가능) */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <h3 className="flex items-center gap-2 font-semibold text-blue-800 mb-2">
              <HelpCircle size={16} />
              설정 방법
            </h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              Firebase 콘솔의 <b>'프로젝트 설정 → 내 앱 → 웹 앱'</b> 섹션에서 
              SDK 설정 및 구성(`firebaseConfig`) 값을 찾아 아래에 입력해주세요.
              이 정보는 브라우저에만 저장됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">API Key</label>
              <input
                name="apiKey"
                value={config.apiKey}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                placeholder="AIza..."
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Auth Domain</label>
              <input
                name="authDomain"
                value={config.authDomain}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                placeholder="project.firebaseapp.com"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Database URL</label>
              <input
                name="databaseURL"
                value={config.databaseURL}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                placeholder="https://project.firebasedatabase.app"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Project ID</label>
              <input
                name="projectId"
                value={config.projectId}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Storage Bucket</label>
              <input
                name="storageBucket"
                value={config.storageBucket}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Messaging Sender ID</label>
              <input
                name="messagingSenderId"
                value={config.messagingSenderId}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">App ID</label>
              <input
                name="appId"
                value={config.appId}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all active:scale-95"
          >
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;