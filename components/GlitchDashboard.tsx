'use client';

import React, { useState, useEffect } from 'react';

interface Glitch {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface GlitchDashboardProps {
  events: any[];
  userCredentials: { email: string; password: string } | null;
  onRefreshCalendar: () => void;
}

const GlitchDashboard: React.FC<GlitchDashboardProps> = ({ events, userCredentials, onRefreshCalendar }) => {
  const [glitches, setGlitches] = useState<Glitch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const fetchGlitches = async () => {
    if (events.length === 0) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/glitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
      const data = await response.json();
      if (data.suggestions) {
        setGlitches(data.suggestions);
      }
    } catch (err) {
      console.error('Glitch 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptGlitch = async (glitch: Glitch) => {
    if (!userCredentials) return;
    
    setIsAdding(glitch.id);
    try {
      const response = await fetch('/api/glitch/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userCredentials.email, 
          password: userCredentials.password,
          glitch 
        }),
      });

      if (response.ok) {
        alert('🎉 성공! Glitch 일정이 애플 캘린더에 추가되었습니다.');
        onRefreshCalendar(); // 캘린더 새로고침
      } else {
        const data = await response.json();
        alert(`오류: ${data.error}`);
      }
    } catch (err) {
      alert('일정 추가 중 오류가 발생했습니다.');
    } finally {
      setIsAdding(null);
    }
  };

  useEffect(() => {
    if (events.length > 0 && glitches.length === 0) {
      fetchGlitches();
    }
  }, [events]);

  return (
    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-2xl border border-purple-500/30 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          GLITCH SYSTEM
        </h2>
        <button
          onClick={fetchGlitches}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-all shadow-[0_0_15px_rgba(147,51,234,0.5)] active:scale-95 disabled:opacity-50 text-sm"
        >
          {isLoading ? '분석 중...' : '새로운 Glitch'}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {glitches.length === 0 && !isLoading && (
          <div className="text-center py-20 text-slate-500 text-sm">
            캘린더 분석을 완료하면<br/>맞춤형 Glitch가 생성됩니다.
          </div>
        )}
        
        {glitches.map((glitch) => (
          <div
            key={glitch.id}
            className="p-4 bg-slate-800 rounded-lg border-l-4 border-purple-500 hover:bg-slate-750 transition-all transform hover:-translate-x-1"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                {glitch.category}
              </span>
            </div>
            <h3 className="font-bold text-lg mb-1 text-white">{glitch.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">
              {glitch.description}
            </p>
            <button 
              onClick={() => handleAcceptGlitch(glitch)}
              disabled={isAdding !== null}
              className="text-xs text-purple-300 hover:text-white font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              {isAdding === glitch.id ? '일정 추가 중...' : '챌린지 수락 (캘린더 추가) →'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlitchDashboard;
