'use client';

import React, { useState, useEffect, useMemo } from 'react';
import CalendarView from '@/components/CalendarView';
import GlitchDashboard from '@/components/GlitchDashboard';
import LoginScreen from '@/components/LoginScreen';
import { Info } from 'lucide-react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [warning, setWarning] = useState('');
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  
  // Category & Suggestion state
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [suggestion, setSuggestion] = useState<{ keyword: string, category: string } | null>(null);
  const [dismissedKeywords, setDismissedKeywords] = useState<string[]>([]);
  const [isSuggestionEnabled, setIsSuggestionEnabled] = useState(false);

  // Lifted state for monthly sync
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load category map from localStorage
  useEffect(() => {
    const savedMap = localStorage.getItem('glitch_category_map');
    if (savedMap) {
      try { setCategoryMap(JSON.parse(savedMap)); } catch (e) {}
    }
  }, []);

  // Apply user-defined category map to events
  const processedEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      category: categoryMap[event.title] || event.category
    }));
  }, [events, categoryMap]);

  // Intelligent keyword analysis
  useEffect(() => {
    if (!isSuggestionEnabled || processedEvents.length === 0 || suggestion || !isLoggedIn) return;

    const keywords: Record<string, number> = {};
    const ignoreList = ['일정', '회의', '준비', '정리', '연습', '작성', '발표', '수정', '수업', '강의', '과제'];
    
    // Get date 60 days ago
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

    processedEvents.forEach(event => {
      const eventDate = new Date(event.start);
      // Only process recent events
      if (eventDate >= twoMonthsAgo) {
        const words = event.title.split(/[\s,.\-()[\]]+/).filter((w: string) => w.length >= 2);
        words.forEach((word: string) => {
          if (!ignoreList.includes(word) && !categoryMap[word] && !dismissedKeywords.includes(word)) {
            keywords[word] = (keywords[word] || 0) + 1;
          }
        });
      }
    });

    const sorted = Object.entries(keywords)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length > 0) {
      const topKeyword = sorted[0][0];
      
      const predict = (t: string) => {
        const lower = t.toLowerCase();
        if (lower.includes('과제') || lower.includes('공부') || lower.includes('시험') || lower.includes('퀴즈')) return '과제/공부';
        if (lower.includes('수업') || lower.includes('강의') || lower.includes('특강')) return '수업/강의';
        if (lower.includes('식사') || lower.includes('약속') || lower.includes('회식') || lower.includes('모임')) return '식사/약속';
        if (lower.includes('취미') || lower.includes('운동') || lower.includes('헬스') || lower.includes('게임')) return '취미/운동';
        return '기타';
      };
      
      const predictedCategory = predict(topKeyword);
      setSuggestion({ keyword: topKeyword, category: predictedCategory });
    }
  }, [processedEvents, categoryMap, dismissedKeywords, isLoggedIn, suggestion, isSuggestionEnabled]);

  const handleClassify = (title: string, category: string) => {
    const newMap = { ...categoryMap, [title]: category };
    setCategoryMap(newMap);
    localStorage.setItem('glitch_category_map', JSON.stringify(newMap));
  };

  const handleApplySuggestion = () => {
    if (!suggestion) return;
    handleClassify(suggestion.keyword, suggestion.category);
    setSuggestion(null);
  };

  const handleDismissSuggestion = () => {
    if (suggestion) setDismissedKeywords([...dismissedKeywords, suggestion.keyword]);
    setSuggestion(null);
  };

  // Filter events for the currently viewed month to pass to the Dashboard
  const currentMonthEvents = useMemo(() => {
    return processedEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.getMonth() === currentDate.getMonth() && 
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  }, [processedEvents, currentDate]);

  const handleLogin = async (email: string, appPassword: string) => {
    setIsLoading(true);
    setLoginError('');
    setWarning('');
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: appPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`[클라이언트] ${data.events?.length || 0}개의 일정을 받았습니다.`);
        setEvents(data.events || []);
        if (data.warning) setWarning(data.warning);
        setCredentials({ email, password: appPassword });
        setIsLoggedIn(true);
      } else {
        setLoginError(data.error || '캘린더 동기화에 실패했습니다.');
      }
    } catch (err) {
      setLoginError('통신 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCalendar = async () => {
    if (!credentials) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      });
      const data = await response.json();
      if (response.ok) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('새로고침 실패');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        {isLoading && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}
        <LoginScreen onLogin={handleLogin} />
        {loginError && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 p-4 bg-red-500 text-white rounded-2xl shadow-2xl z-50 font-bold">
            {loginError}
          </div>
        )}
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {warning && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 text-amber-700 text-sm font-bold rounded-2xl shadow-sm flex justify-between items-center">
            <span>⚠️ {warning}</span>
            <button onClick={() => setWarning('')} className="text-amber-900 hover:text-black p-1">✕</button>
          </div>
        )}
        
        <header className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              GLITCH: <span className="text-indigo-600 font-medium text-2xl tracking-normal italic opacity-80">Routine Error Injection</span>
            </h1>
            <p className="text-slate-500 mt-2 font-bold opacity-60 text-sm">
              익숙한 루틴에서 한 발짝 벗어나보세요. 작은 오류(Glitch)가 새로운 성장을 만듭니다. 🌱
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const newState = !isSuggestionEnabled;
                  setIsSuggestionEnabled(newState);
                  if (!newState) setSuggestion(null);
                }}
                className={`px-4 py-2.5 text-xs font-black border rounded-2xl transition-all shadow-sm active:scale-95 ${
                  isSuggestionEnabled 
                  ? "text-indigo-500 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100" 
                  : "text-slate-400 border-slate-200 bg-white/50 hover:bg-slate-50"
                }`}
              >
                카테고리 추천 {isSuggestionEnabled ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={() => { setIsLoggedIn(false); setEvents([]); }}
                className="px-6 py-2.5 text-xs text-slate-500 hover:text-indigo-600 font-black border border-slate-200 rounded-2xl hover:bg-white hover:border-indigo-100 transition-all shadow-sm active:scale-95 bg-white/50"
              >
                LOGOUT
              </button>
            </div>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm tracking-tight">
              {events.length} EVENTS LOADED
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none rounded-[32px]">
               <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          )}

          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center px-4 relative">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.4)]"></span>
                APPLE CALENDAR
              </h2>

              {/* Keyword Suggestion Bubble - Moved next to header */}
              {isSuggestionEnabled && suggestion && (
                <div className="absolute left-[240px] top-[-15px] z-[500] animate-in slide-in-from-left-4 duration-500">
                  <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 relative border border-slate-700/50 backdrop-blur-md">
                    {/* Left Triangle */}
                    <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900 rotate-45 border-l border-b border-slate-700/50"></div>
                    
                    <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse">
                      <Info className="w-4 h-4 text-white" />
                    </div>
                    
                    <p className="text-[11px] font-bold leading-tight">
                      <span className="text-indigo-400">"{suggestion.keyword}"</span> 일정은 전부 <span className="text-indigo-400">"{suggestion.category}"</span>로 분류할까요?
                    </p>

                    <div className="flex items-center gap-1.5 ml-2">
                      <button onClick={handleApplySuggestion} className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-all active:scale-95">네</button>
                      <button onClick={handleDismissSuggestion} className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black px-2 py-1.5 rounded-lg">아니오</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <CalendarView 
              events={events} 
              currentDate={currentDate} 
              onNavigate={setCurrentDate}
              categoryMap={categoryMap}
              onClassify={handleClassify}
            />
          </div>

          <div className="space-y-6 h-[750px]">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 px-4">
              <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full shadow-[0_0_12px_rgba(129,140,248,0.4)]"></span>
              AI GLITCHES
            </h2>
            <GlitchDashboard 
              events={currentMonthEvents} 
              userCredentials={credentials} 
              onRefreshCalendar={refreshCalendar} 
            />
          </div>
        </div>
      </div>
    </main>
  );
}
