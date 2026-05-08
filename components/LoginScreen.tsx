'use client';

import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, appPassword: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-[0_20px_60px_-15px_rgba(30,41,59,0.1)] border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100">
             {/* Apple-style icon with sophisticated touch */}
            <svg className="w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.58-2.01-.58-3.14 0-1.31.7-2.12.51-2.92-.35C5.45 17.8 4.3 12.8 6.4 9.17c1.05-1.81 2.91-2.95 4.95-2.98 1.55-.03 2.6.86 3.51.86.91 0 2.24-1.04 4.08-.85 1.76.08 3.12.69 3.96 1.76-3.41 1.84-2.88 6.13.56 7.42-1.01 2.37-2.31 4.7-4.41 6.9zm-2.81-15.02c-.15-2.07 1.76-3.83 3.65-4.26.43 2.31-2.03 4.41-3.65 4.26z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Sign in with Apple ID</h1>
          <p className="text-slate-500 font-medium">Enter your credentials to sync your calendar with <span className="text-indigo-500 font-bold italic">GLITCH</span>.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
              Apple ID Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-slate-800 focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all placeholder:text-slate-300 outline-none font-medium"
              placeholder="name@icloud.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
              App-Specific Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-slate-800 focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all placeholder:text-slate-300 outline-none font-medium"
              placeholder="xxxx-xxxx-xxxx-xxxx"
            />
            <p className="mt-2 text-[10px] text-slate-400 px-1 font-medium">
              * Generate this at <a href="https://appleid.apple.com" target="_blank" className="text-indigo-400 hover:underline">appleid.apple.com</a>
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm text-center font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-200"
          >
            Continue
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setShowForgotModal(true)}
            className="text-sm font-bold text-slate-400 hover:text-indigo-500 transition-colors"
          >
            Forgot Apple ID or Password?
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-4 tracking-tight">Forgot Apple ID or Password?</h3>
            <p className="text-slate-500 text-center text-sm font-medium leading-relaxed mb-8">
              Apple ID 또는 암호를 변경하려면<br />
              <span className="text-indigo-500 font-bold underline underline-offset-4">Apple 기기</span>(설정 &gt; 사용자 이름 &gt; 로그인 및 보안)를 통해<br />
              확인 및 수정한 후 다시 방문해주세요.
            </p>
            <button 
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-200"
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
