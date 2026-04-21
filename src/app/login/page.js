'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Shield, ArrowRight, Loader2, Radio, Globe, Server } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        router.push('/');
      } else {
        setError(data.message || 'Access Denied: Invalid Credentials');
      }
    } catch (err) {
      setError('Connection Failure: Central Node Unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#02040a] relative overflow-hidden font-sans selection:bg-sky-500/30">
      {/* Dynamic Mesh Background */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 blur-[150px] rounded-full animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse delay-700"></div>
         <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[120px] rounded-full animate-bounce duration-[10s]"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 md:p-12 rounded-[2.5rem] border border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-6 group">
               <div className="absolute -inset-4 bg-sky-500/20 rounded-full blur-xl group-hover:bg-sky-500/30 transition-all"></div>
               <div className="w-16 h-16 bg-slate-900 border border-sky-500/30 rounded-2xl flex items-center justify-center mx-auto relative z-10 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                  <Shield className="w-8 h-8 text-sky-400" />
               </div>
               <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-[#02040a] z-20">
                  <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
               </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">MPCPL MESH</h1>
            <p className="text-slate-500 text-[10px] mt-3 font-black uppercase tracking-[0.4em] opacity-80">Strategic Communications Terminal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Access</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 group-focus-within:text-sky-500 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mpcpl.com" 
                  className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-white placeholder:text-slate-800 focus:outline-none focus:border-sky-500/40 transition-all font-medium text-sm shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Secret Protocol</label>
                <a href="#" className="text-[9px] text-sky-500/60 hover:text-sky-500 font-black uppercase tracking-tighter transition-colors">Reset Key</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 group-focus-within:text-sky-500 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-white placeholder:text-slate-800 focus:outline-none focus:border-sky-500/40 transition-all font-medium text-sm shadow-inner"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] py-3.5 px-4 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full relative bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 py-4.5 rounded-[1.25rem] text-white text-xs font-black uppercase tracking-[0.2em] transition-all shadow-[0_15px_30px_rgba(14,165,233,0.25)] flex items-center justify-center gap-3 active:scale-[0.98] group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500"></div>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin relative z-10" />
              ) : (
                <>
                  <span className="relative z-10">Initiate Link</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform relative z-10" />
                </>
              )}
            </button>
          </form>

          <footer className="mt-12 pt-8 border-t border-white/5">
             <div className="flex items-center justify-between opacity-30 group cursor-default">
                <div className="flex items-center gap-4">
                   <Globe className="w-4 h-4 text-slate-500" />
                   <Server className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">System Build v4.0.2</p>
             </div>
          </footer>
        </div>
        
        <p className="text-center mt-8 text-[9px] text-slate-600 font-bold uppercase tracking-[0.3em] opacity-40">
           Distributed exclusively by MPCPL Enterprise Security
        </p>
      </div>
    </main>
  );
}
