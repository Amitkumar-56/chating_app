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
    <main className="min-h-screen bg-[#0b141a] flex flex-col items-center relative overflow-hidden font-sans selection:bg-[#00a884]/30">
      {/* WhatsApp Signature Top Bar */}
      <div className="absolute top-0 left-0 w-full h-[220px] bg-[#00a884] z-0"></div>

      <div className="w-full max-w-[1000px] mt-16 md:mt-24 relative z-10 px-4">
        {/* Header - Brand */}
        <div className="flex items-center gap-4 mb-10 text-white animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-[#00a884]" />
           </div>
           <h1 className="text-sm font-bold tracking-widest uppercase">MPCPL WEB</h1>
        </div>

        <div className="bg-[#111b21] rounded-sm shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[450px] animate-in zoom-in duration-500">
          {/* Left Side - Info */}
          <div className="flex-1 p-10 md:p-16 border-r border-[#222d34]">
             <h2 className="text-3xl font-light text-[#e9edef] mb-10">To use MPCPL Mesh on your computer:</h2>
             <ol className="space-y-6 text-[#8696a0] text-lg list-decimal list-inside">
                <li>Enter your enterprise credentials below.</li>
                <li>Ensure your node is ready for secure handshake.</li>
                <li>Initiate the encrypted link session.</li>
             </ol>
             
             <div className="mt-16 pt-8 border-t border-[#222d34] flex items-center gap-4 opacity-50">
                <Radio className="w-5 h-5 text-[#25D366] animate-pulse" />
                <p className="text-xs uppercase tracking-widest font-bold">Encrypted End-to-End Session</p>
             </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full md:w-[400px] p-10 bg-[#111b21] flex flex-col justify-center">
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-0 top-3 w-5 h-5 text-[#8696a0] group-focus-within:text-[#00a884] transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enterprise Identity (Email)" 
                    className="w-full bg-transparent border-b border-[#222d34] py-3 pl-8 text-[#e9edef] placeholder:text-[#8696a0] focus:outline-none focus:border-[#00a884] transition-all text-md"
                    required
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-0 top-3 w-5 h-5 text-[#8696a0] group-focus-within:text-[#00a884] transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Access Protocol Key" 
                    className="w-full bg-transparent border-b border-[#222d34] py-3 pl-8 text-[#e9edef] placeholder:text-[#8696a0] focus:outline-none focus:border-[#00a884] transition-all text-md"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-xs font-bold uppercase tracking-tight flex items-center gap-2 animate-in fade-in duration-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#00a884] hover:bg-[#008f6f] disabled:bg-[#202c33] disabled:text-[#8696a0] py-3 rounded-md text-white font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-3 active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In & Sync'}
              </button>
            </form>

            <div className="mt-10 text-center">
               <span className="text-[#8696a0] text-[11px] uppercase tracking-widest opacity-40">MPCPL Industrial Security Systems</span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-[#8696a0] opacity-30 text-[10px] uppercase tracking-[0.5em] font-black">
          Priority Mesh Access v4.2.0
        </div>
      </div>
    </main>
  );
}
