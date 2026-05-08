'use client';

import React, { useState, useEffect } from 'react';

interface Glitch {
  id: string;
  title: string;
  description: string;
  category: string;
  recommendedDate?: string;
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
  
  // Settings state
  const [difficulty, setDifficulty] = useState('보통');
  const [targetCategory, setTargetCategory] = useState('전체');
  
  // Date selection state
  const [pendingGlitch, setPendingGlitch] = useState<Glitch | null>(null);
  const [customDate, setCustomDate] = useState('');

  const defaultSuggestions: Glitch[] = [
    { id: 'def-1', title: '명상과 휴식', description: '바쁜 일정 사이에 15분간의 명상을 추가해보세요.', category: '취미/운동' },
    { id: 'def-2', title: '새로운 산택로', description: '평소 가던 길 대신 새로운 길로 산책해보세요.', category: '취미/운동' },
    { id: 'def-3', title: '디지털 디톡스', description: '1시간 동안 전자기기 없이 책을 읽어보세요.', category: '기타' },
    { id: 'def-4', title: '손편지 쓰기', description: '소중한 사람에게 짧은 감사 편지를 써보세요.', category: '기타' },
    { id: 'def-5', title: '낯선 카페 방문', description: '한 번도 가보지 않은 동네 카페에서 커피를 마셔보세요.', category: '식사/약속' }
  ];

  const fetchGlitches = async (isInitial = false) => {
    if (events.length === 0) return;
    
    // 초기 로딩 시에는 랜덤하게 기본 제안 3개를 보여줌 (API 절약)
    if (isInitial && glitches.length === 0) {
      const shuffled = [...defaultSuggestions].sort(() => 0.5 - Math.random());
      setGlitches(shuffled.slice(0, 3));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/glitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, difficulty, category: targetCategory }),
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

  const startAcceptingGlitch = (glitch: Glitch) => {
    setPendingGlitch(glitch);
    // 추천 날짜를 기본값으로 설정 (ISO -> datetime-local format)
    const date = glitch.recommendedDate ? new Date(glitch.recommendedDate) : new Date();
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setCustomDate(localDate);
  };

  const handleConfirmGlitch = async () => {
    if (!userCredentials || !pendingGlitch) return;
    
    setIsAdding(pendingGlitch.id);
    try {
      const response = await fetch('/api/glitch/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userCredentials.email, 
          password: userCredentials.password,
          glitch: pendingGlitch,
          startDate: customDate
        }),
      });

      if (response.ok) {
        alert('🎉 성공! Glitch 일정이 애플 캘린더에 추가되었습니다.');
        setPendingGlitch(null);
        onRefreshCalendar(); 
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
    if (events.length > 0) {
      // 최초 1회만 기본 제안 로드, 설정 변경 시에는 디바운스 후 API 호출
      if (glitches.length === 0) {
        fetchGlitches(true);
      } else {
        const timer = setTimeout(() => {
          fetchGlitches();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [events, difficulty, targetCategory]);

  return (
    <div className="bg-slate-50/50 backdrop-blur-xl text-slate-800 p-8 rounded-[32px] shadow-[0_10px_40px_rgba(15,23,42,0.03)] border border-white h-full flex flex-col relative">
      <div className="mb-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            GLITCH SYSTEM
          </h2>
          <button
            onClick={fetchGlitches}
            disabled={isLoading}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 text-xs shadow-lg shadow-slate-200"
          >
            {isLoading ? '분석 중...' : '새로운 Glitch ✨'}
          </button>
        </div>

        {/* Settings Controls */}
        <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-wider">
          <div className="flex bg-white/80 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            {['쉬움', '보통', '어려움'].map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-1.5 rounded-xl transition-all ${difficulty === d ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {d}
              </button>
            ))}
          </div>
          <select 
            value={targetCategory}
            onChange={(e) => setTargetCategory(e.target.value)}
            className="bg-white/80 p-1.5 px-4 rounded-2xl border border-slate-100 text-slate-600 outline-none font-bold shadow-sm hover:border-indigo-100 transition-all cursor-pointer"
          >
            {['전체', '과제/공부', '수업/강의', '식사/약속', '취미/운동', '기타'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
        {glitches.length === 0 && !isLoading && (
          <div className="text-center py-24 text-slate-400 text-sm font-medium">
            캘린더 분석을 완료하면<br/>맞춤형 <span className="text-indigo-600 font-bold">Glitch</span>가 생성됩니다.
          </div>
        )}
        
        {glitches.map((glitch) => (
          <div
            key={glitch.id}
            className="p-6 bg-white rounded-[24px] border border-slate-50 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.06)] hover:border-indigo-50 transition-all transform hover:-translate-y-1 group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-full transition-colors">
                {glitch.category}
              </span>
            </div>
            <h3 className="font-black text-lg mb-2 text-slate-800 tracking-tight">{glitch.title}</h3>
            <p className="text-slate-500 text-[13px] font-medium leading-relaxed mb-6 opacity-80">
              {glitch.description}
            </p>
            <button 
              onClick={() => startAcceptingGlitch(glitch)}
              disabled={isAdding !== null}
              className="w-full py-3.5 text-xs text-white bg-slate-900 hover:bg-indigo-950 rounded-[18px] font-black shadow-md shadow-slate-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              챌린지 수락 (날짜 선택)
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Date Selection Modal */}
      {pendingGlitch && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-20 flex items-center justify-center p-8 rounded-[32px]">
          <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-slate-100 w-full animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">날짜를 확인해주세요!</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
              AI가 제안한 날짜입니다.<br/>마음에 안 들면 직접 수정할 수 있어요.
            </p>
            <input 
              type="datetime-local" 
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-8 text-sm outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-bold text-slate-700"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setPendingGlitch(null)}
                className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all"
              >
                취소
              </button>
              <button 
                onClick={handleConfirmGlitch}
                disabled={isAdding !== null}
                className="flex-[2] py-4 text-sm font-black text-white bg-slate-900 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isAdding ? '추가 중...' : '이대로 추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlitchDashboard;
