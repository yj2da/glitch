'use client';

import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, appPassword: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl p-10 shadow-2xl border border-slate-800">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-white/10">
             {/* Simple Apple-like Icon */}
            <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.58-2.01-.58-3.14 0-1.31.7-2.12.51-2.92-.35C5.45 17.8 4.3 12.8 6.4 9.17c1.05-1.81 2.91-2.95 4.95-2.98 1.55-.03 2.6.86 3.51.86.91 0 2.24-1.04 4.08-.85 1.76.08 3.12.69 3.96 1.76-3.41 1.84-2.88 6.13.56 7.42-1.01 2.37-2.31 4.7-4.41 6.9zm-2.81-15.02c-.15-2.07 1.76-3.83 3.65-4.26.43 2.31-2.03 4.41-3.65 4.26z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Sign in with Apple ID</h1>
          <p className="text-slate-400">Enter your credentials to sync your calendar with GLITCH.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-1">
              Apple ID Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border-none rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
              placeholder="name@icloud.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-1">
              App-Specific Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border-none rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
              placeholder="xxxx-xxxx-xxxx-xxxx"
            />
            <p className="mt-2 text-[10px] text-slate-500 px-1 italic">
              * Generate this at appleid.apple.com
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-slate-200 active:scale-[0.98] transition-all shadow-xl shadow-white/5"
          >
            Continue
          </button>
        </form>

        <div className="mt-8 text-center">
          <a href="#" className="text-sm text-blue-500 hover:underline">
            Forgot Apple ID or Password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
