'use client';

import React, { useState } from 'react';
import CalendarView from '@/components/CalendarView';
import GlitchDashboard from '@/components/GlitchDashboard';
import LoginScreen from '@/components/LoginScreen';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [warning, setWarning] = useState('');
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        <LoginScreen onLogin={handleLogin} />
        {loginError && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 p-4 bg-red-600 text-white rounded-lg shadow-2xl z-50">
            {loginError}
          </div>
        )}
      </>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {warning && (
          <div className="mb-4 p-3 bg-amber-100 border-l-4 border-amber-500 text-amber-700 text-sm font-bold rounded shadow-sm flex justify-between items-center">
            <span>⚠️ {warning}</span>
            <button onClick={() => setWarning('')} className="text-amber-900 hover:text-black">✕</button>
          </div>
        )}
        
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              GLITCH: <span className="text-slate-400 font-medium text-2xl tracking-normal">Routine Error Injection</span>
            </h1>
            <p className="text-slate-600 mt-2 font-medium">
              안전지대를 벗어나세요. 일상에 의도적인 오류를 주입하여 뜻밖의 성장을 경험하세요.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button 
              onClick={() => { setIsLoggedIn(false); setEvents([]); }}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 font-bold border border-slate-200 rounded-full hover:bg-slate-100 transition-all"
            >
              로그아웃
            </button>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              총 {events.length}개의 일정 로드됨
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                애플 캘린더
              </h2>
            </div>
            <CalendarView events={events} />
          </div>

          <div className="space-y-4 h-[750px]">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              AI 맞춤형 Glitch
            </h2>
            <GlitchDashboard 
              events={events} 
              userCredentials={credentials} 
              onRefreshCalendar={refreshCalendar} 
            />
          </div>
        </div>
      </div>
    </main>
  );
}
