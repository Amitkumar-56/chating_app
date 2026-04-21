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
    <main className="min-h-screen bg-[#0b141a] flex flex-col items-center relative overflow-hidden font-sans">
      {/* WhatsApp Signature Top Bar */}
      <div className="absolute top-0 left-0 w-full h-[150px] md:h-[220px] bg-[#00a884] z-0"></div>

      <div className="w-full max-w-[1000px] mt-8 md:mt-24 relative z-10 px-4">
        {/* Header - Brand */}
        <div className="flex items-center gap-4 mb-6 md:mb-10 text-white">
           <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-[#00a884]" />
           </div>
           <h1 className="text-sm font-bold tracking-widest uppercase">MPCPL WEB</h1>
        </div>

        <div className="bg-[#f0f2f5] md:bg-[#111b21] rounded-sm shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-0 md:min-h-[450px]">
          {/* Left Side - Info (Hidden on Mobile for speed) */}
          <div className="hidden md:flex flex-1 p-10 md:p-16 border-r border-[#222d34] flex-col">
             <h2 className="text-3xl font-light text-[#e9edef] mb-10">To use MPCPL Mesh on your computer:</h2>
             <ol className="space-y-6 text-[#8696a0] text-lg list-decimal list-inside">
                <li>Enter your enterprise credentials below.</li>
                <li>Ensure your node is ready for secure handshake.</li>
                <li>Initiate the encrypted link session.</li>
             </ol>
          </div>

          {/* Right Side - Login Form (Main Focus on Mobile) */}
          <div className="w-full md:w-[450px] p-8 md:p-12 flex flex-col justify-center">
            <div className="md:hidden text-center mb-8">
               <h2 className="text-2xl font-bold text-[#111b21]">Login to Session</h2>
               <p className="text-sm text-[#667781]">Secure Enterprise Communication</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-[#8696a0]" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address" 
                    className="w-full bg-white md:bg-transparent border border-gray-300 md:border-0 md:border-b md:border-[#222d34] p-3 pl-12 md:pl-8 rounded-lg md:rounded-none text-[#111b21] md:text-[#e9edef] focus:outline-none focus:border-[#00a884] shadow-sm md:shadow-none"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-[#8696a0]" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password" 
                    className="w-full bg-white md:bg-transparent border border-gray-300 md:border-0 md:border-b md:border-[#222d34] p-3 pl-12 md:pl-8 rounded-lg md:rounded-none text-[#111b21] md:text-[#e9edef] focus:outline-none focus:border-[#00a884] shadow-sm md:shadow-none"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 bg-red-50 p-2 rounded text-xs font-bold border border-red-200">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#00a884] hover:bg-[#008f6f] py-4 rounded-md text-white font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In Now'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
