'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, List, CheckCircle2, Info, Maximize2, Minimize2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  selectedEvents: any[];
  onClearSelectedEvents: () => void;
  onRemoveSelectedEvent: (event: any) => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

const GlitchDashboard: React.FC<GlitchDashboardProps> = ({ 
  events, userCredentials, onRefreshCalendar, 
  selectedEvents, onClearSelectedEvents, onRemoveSelectedEvent,
  isMaximized, onToggleMaximize
}) => {
  const [glitches, setGlitches] = useState<Glitch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  
  // Settings state
  const [difficulty, setDifficulty] = useState('보통');
  const [targetCategory, setTargetCategory] = useState('전체');
  const [targetGoal, setTargetGoal] = useState('전체');
  const [targetTone, setTargetTone] = useState('나의 일정처럼');
  const [isCustomTone, setIsCustomTone] = useState(false);
  
  // Load settings from localStorage
  useEffect(() => {
    const savedGoal = localStorage.getItem('glitch_target_goal');
    if (savedGoal) setTargetGoal(savedGoal);
    const savedTone = localStorage.getItem('glitch_target_tone');
    if (savedTone) {
      setTargetTone(savedTone);
      const defaults = ['다정하고 친근한', '냉철하고 분석적인', '에너제틱하고 열정적인', '나의 일정처럼'];
      if (!defaults.includes(savedTone)) setIsCustomTone(true);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('glitch_target_goal', targetGoal);
    localStorage.setItem('glitch_target_tone', targetTone);
  }, [targetGoal, targetTone]);

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
        body: JSON.stringify({ 
          events, 
          difficulty, 
          category: targetCategory, 
          goal: targetGoal, 
          tone: targetTone,
          selectedEvents: selectedEvents.map(e => ({ title: e.title, start: e.start }))
        }),
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
      if (glitches.length === 0) {
        fetchGlitches(true);
      } else {
        const timer = setTimeout(() => {
          fetchGlitches();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [events, difficulty, targetCategory, targetGoal, targetTone, selectedEvents]);

  const glitchDegreeData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Filter events to only include Today's Month
    const monthEvents = events.filter(e => {
      const d = new Date(e.start);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const glitchEvents = monthEvents.filter(e => e.title.includes('[GLITCH]'));
    const glitchCount = glitchEvents.length;
    // Total goal is 30 for overall level calculation
    const overallPercentage = Math.min(Math.round((glitchCount / 30) * 100), 100);
    
    // Category specific calculations with fixed goal of 10
    const categories = ['과제/공부', '수업/강의', '식사/약속', '취미/운동', '기타'];
    const categoryStats = categories.map(cat => {
      const catEvents = monthEvents.filter(e => e.category === cat);
      const catGlitchEvents = catEvents.filter(e => e.title.includes('[GLITCH]'));
      const catGlitch = catGlitchEvents.length;
      const catPercentage = Math.min(Math.round((catGlitch / 10) * 100), 100);
      
      const colors: any = {
        '과제/공부': 'bg-purple-500',
        '수업/강의': 'bg-blue-500',
        '식사/약속': 'bg-green-500',
        '취미/운동': 'bg-orange-500',
        '기타': 'bg-slate-400'
      };

      return { name: cat, glitch: catGlitch, percentage: catPercentage, color: colors[cat] };
    });

    let level = '완벽한 루틴';
    let color = 'from-slate-400 to-slate-500';
    let message = '익숙한 루틴 속에 머물러 계시네요.';

    if (glitchCount >= 10) {
      level = '카오스 메이커';
      color = 'from-purple-600 via-indigo-600 to-blue-600';
      message = '세상을 뒤흔드는 변화의 중심에 있습니다! 🔥';
    } else if (glitchCount >= 5) {
      level = '자유로운 여행자';
      color = 'from-indigo-500 to-purple-500';
      message = '일상의 경계를 허물기 시작했습니다. 멋져요!';
    } else if (glitchCount >= 1) {
      level = '작은 일탈자';
      color = 'from-blue-400 to-indigo-500';
      message = '새로운 변화를 향한 첫 발을 떼셨군요? 🌱';
    }

    return { glitchCount, percentage: overallPercentage, level, color, message, categoryStats };
  }, [events]);

  return (
    <div className="bg-slate-50/50 backdrop-blur-xl text-slate-800 p-5 rounded-[32px] shadow-[0_10px_40px_rgba(15,23,42,0.03)] border border-white h-full flex flex-col relative transition-all duration-500 overflow-hidden">
      
      {/* Glitch Degree Widget */}
      <div className={cn(
        "mb-5 bg-white rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group transition-all duration-500 flex-shrink-0",
        isMaximized ? "p-4" : "p-5"
      )}>
        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${glitchDegreeData.color}`}></div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">나의 GLITCH 정도 ({new Date().getMonth() + 1}월)</span>
              <h3 className={cn(
                "font-black bg-gradient-to-r transition-all duration-500",
                glitchDegreeData.color,
                "bg-clip-text text-transparent text-xl"
              )}>
                LEVEL: {glitchDegreeData.level}
              </h3>
            </div>
            <button 
              onClick={onToggleMaximize}
              className="p-1.5 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all border border-transparent hover:border-slate-100"
              title={isMaximized ? "상세보기" : "요약보기"}
            >
              {isMaximized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
          </div>
          {!isMaximized && (
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">{glitchDegreeData.glitchCount}</span>
              <span className="text-[10px] font-bold text-slate-400 ml-1">GLITCHES</span>
            </div>
          )}
        </div>

        {/* Details - Visible when NOT maximized */}
        <div className={cn(
          "space-y-4 overflow-y-auto transition-all duration-500 ease-in-out custom-scrollbar",
          isMaximized ? "max-h-0 opacity-0 mt-0" : "max-h-[180px] opacity-100 mt-4 pr-1"
        )}>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-slate-500 uppercase tracking-tighter">Monthly Progress</span>
              <span className="text-indigo-600 font-black">{glitchDegreeData.percentage}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${glitchDegreeData.color} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.2)]`}
                style={{ width: `${glitchDegreeData.percentage}%` }}
              ></div>
            </div>
            <p className="text-[9px] text-slate-400 font-bold italic leading-none">{glitchDegreeData.message}</p>
          </div>

          <div className="pt-2 border-t border-slate-50 grid grid-cols-1 gap-2">
            {glitchDegreeData.categoryStats.map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">{stat.name}</span>
                  <span className="text-slate-600">{stat.glitch} / 10</span>
                </div>
                <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stat.color} transition-all duration-1000 ease-out opacity-80 group-hover:opacity-100`}
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col">
        <div className="space-y-6 pb-6">
          <div className="flex justify-between items-center sticky top-0 bg-slate-50/50 backdrop-blur-md z-10 py-2">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                GLITCH SYSTEM
              </h2>
              <button 
                onClick={onToggleMaximize}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100"
                title={isMaximized ? "축소하기" : "전체보기"}
              >
                {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
            <button
              onClick={() => fetchGlitches()}
              disabled={isLoading}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 text-xs shadow-lg shadow-slate-200"
            >
              {isLoading ? '분석 중...' : '새로운 Glitch ✨'}
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-wider">
              <div className="flex bg-white/80 p-1.5 rounded-2xl border border-slate-100 shadow-sm flex-shrink-0">
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
                className="bg-white/80 p-1.5 px-6 rounded-2xl border border-slate-100 text-slate-600 outline-none font-bold shadow-sm hover:border-indigo-100 transition-all cursor-pointer min-w-[120px]"
              >
                {['전체', '과제/공부', '수업/강의', '식사/약속', '취미/운동', '기타'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">나의 현재 목표</span>
                <input 
                  type="text"
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  placeholder="예: 매일 책 10페이지 읽기..."
                  className="w-full bg-white/80 p-4 px-5 rounded-2xl border border-slate-100 text-slate-700 outline-none font-bold shadow-sm focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all text-xs"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">답변 말투 설정</span>
                <div className="relative space-y-3">
                  <select 
                    value={isCustomTone ? 'custom' : targetTone}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomTone(true);
                        setTargetTone('');
                      } else {
                        setIsCustomTone(false);
                        setTargetTone(e.target.value);
                      }
                    }}
                    className="w-full bg-white/80 p-4 px-5 rounded-2xl border border-slate-100 text-slate-700 outline-none font-bold shadow-sm focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all text-xs cursor-pointer appearance-none"
                  >
                    <option value="다정하고 친근한">다정하고 친근한</option>
                    <option value="냉철하고 분석적인">냉철하고 분석적인</option>
                    <option value="에너제틱하고 열정적인">에너제틱하고 열정적인</option>
                    <option value="나의 일정처럼">나의 일정처럼 (스타일 모방)</option>
                    <option value="custom">직접 입력...</option>
                  </select>
                  {isCustomTone && (
                    <div className="relative animate-in slide-in-from-top-2 duration-300">
                      <input 
                        type="text"
                        value={targetTone}
                        onChange={(e) => setTargetTone(e.target.value)}
                        placeholder="원하는 말투를 입력하세요"
                        className="w-full bg-white p-4 px-5 rounded-2xl border border-indigo-200 text-slate-700 outline-none font-bold shadow-md focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-xs"
                        autoFocus
                      />
                      <button 
                        onClick={() => { setIsCustomTone(false); setTargetTone('나의 일정처럼'); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 p-1"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {selectedEvents.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">선택된 일정 ({selectedEvents.length})</span>
                    <button onClick={onClearSelectedEvents} className="text-[9px] font-black text-slate-400 hover:text-red-500 transition-colors">모두 삭제</button>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 max-h-[120px] overflow-y-auto">
                    {selectedEvents.map((event, idx) => (
                      <div key={idx} className="bg-white px-3 py-2 rounded-xl border border-indigo-100 text-[10px] font-bold text-indigo-600 flex items-center gap-2 shadow-sm group relative hover:pr-8 transition-all">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                        {event.title}
                        <button onClick={() => onRemoveSelectedEvent(event)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all font-black"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5 pb-10">
            {glitches.length === 0 && !isLoading && (
              <div className="text-center py-24 text-slate-400 text-sm font-medium leading-relaxed">
                캘린더 분석을 완료하면<br/>맞춤형 <span className="text-indigo-600 font-bold">Glitch</span>가 생성됩니다.
              </div>
            )}
            
            {glitches.map((glitch) => (
              <div
                key={glitch.id}
                className="p-6 bg-white rounded-[24px] border border-slate-50 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.06)] hover:border-indigo-50 transition-all transform hover:-translate-y-1 group flex flex-col"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-full transition-colors">
                    {glitch.category}
                  </span>
                </div>
                <h3 className="font-black text-lg mb-2 text-slate-800 tracking-tight">{glitch.title}</h3>
                <p className="text-slate-500 text-[13px] font-medium leading-relaxed mb-6 opacity-80 flex-1">
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
        </div>
      </div>

      {/* Date Selection Modal */}
      {pendingGlitch && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-8 rounded-[32px]">
          <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-slate-100 max-w-md w-full animate-in fade-in zoom-in duration-300">
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
              <button onClick={() => setPendingGlitch(null)} className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-all">취소</button>
              <button onClick={handleConfirmGlitch} disabled={isAdding !== null} className="flex-[2] py-4 text-sm font-black text-white bg-slate-900 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50">{isAdding ? '추가 중...' : '이대로 추가하기'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlitchDashboard;
