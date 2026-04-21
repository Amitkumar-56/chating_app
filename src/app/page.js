'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send, User, MessageSquare, Shield, RefreshCw, LogOut, Search,
  Paperclip, Smile, FileText, Download, Loader2, Bell, BellOff, CheckCheck,
  Phone, Video, AlertTriangle, MonitorSmartphone, DownloadCloud, Radio, Speaker, X, PhoneCall, PhoneOff, Mic, VideoOff, Layers, Zap, Cpu
} from 'lucide-react';
import { playNotificationSound, startRingtone, stopRingtone } from '../utils/sound';
import { showNotification, requestNotificationPermission } from '../utils/notifications';

export default function ChatPage() {
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notifPermission, setNotifPermission] = useState('default');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isAppActive, setIsAppActive] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Calling State
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isCallOngoing, setIsCallOngoing] = useState(false);
  const [activeCallId, setActiveCallId] = useState(null);

  const lastMessageIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInitializedRef = useRef(false);
  const router = useRouter();

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
        setDbError(null);
      } else {
        setDbError(data.error || 'Database connection error');
      }
    } catch (e) {
      setDbError('Failed to reach server');
    }
    setLoading(false);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) { router.push('/login'); return; }
    setCurrentUser(JSON.parse(savedUser));
    fetchEmployees();

    if (typeof window !== 'undefined') {
      setNotifPermission(Notification.permission);
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
      window.addEventListener('blur', () => setIsAppActive(false));
      window.addEventListener('focus', () => setIsAppActive(true));
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBtn(true);
      });
    }
  }, []);

  const initAudio = () => {
    if (audioInitializedRef.current) return;
    playNotificationSound();
    audioInitializedRef.current = true;
  };

  useEffect(() => {
    let timeoutId;
    let isMounted = true;

    if (currentUser) {
      const fetchAll = async () => {
        if (!isMounted) return;
        
        // Execute fetches in parallel but wait for them to finish before scheduling next
        try {
          await Promise.all([
            fetchUnreadCounts(),
            selectedSession ? fetchMessages(selectedSession.responder.id, true) : Promise.resolve(),
          ]);
        } catch (error) {
          console.error("Polling error:", error);
        }

        if (isMounted) {
          timeoutId = setTimeout(fetchAll, 3000);
        }
      };

      fetchAll();
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [selectedSession, currentUser]);

  // Global Check for ANY new unread messages to trigger notifications
  useEffect(() => {
    if (!currentUser) return;
    
    let lastCheckedCount = 0;
    const checkGlobal = async () => {
      try {
        const res = await fetch(`/api/messages/unread?receiverId=${currentUser.id}`);
        const data = await res.json();
        if (data.success && data.counts) {
          const totalNew = data.counts.reduce((a, b) => a + b.unread_count, 0);
          if (totalNew > lastCheckedCount) {
             // New message arrived globally!
             playNotificationSound(); // Play sound always on new message
             
             if (!isAppActive) {
                showNotification(`MPCPL Mesh`, `New encrypted packet received from personnel.`);
             }
          }
          lastCheckedCount = totalNew;
          fetchUnreadCounts(); // Update UI badges
        }
      } catch (e) {}
    };

    const interval = setInterval(checkGlobal, 4000);
    return () => clearInterval(interval);
  }, [currentUser, isAppActive]);

  // Global call checking disabled
  const checkGlobalCalls = async () => {};

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUnreadCounts = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/messages/unread?receiverId=${currentUser.id}`);
      const data = await res.json();
      if (data.success && data.counts) {
        const countsMap = {};
        data.counts.forEach(item => { countsMap[item.sender_id] = item.unread_count; });
        setUnreadCounts(countsMap);
        if ('setAppBadge' in navigator) {
          const total = data.counts.reduce((a, b) => a + b.unread_count, 0);
          navigator.setAppBadge(total).catch(() => { });
        }
      }
    } catch (e) { }
  };

  const startCall = async (type) => {
    initAudio();
    setIsCalling(true);
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller_id: currentUser.id,
          receiver_id: selectedSession.responder.id,
          call_type: type
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveCallId(data.callId);
        setTimeout(() => {
          setIsCalling(false);
          setIsCallOngoing(true);
        }, 2500);
      }
    } catch (e) {
      setIsCalling(false);
    }
  };

  const acceptCall = async () => {
    initAudio();
    stopRingtone();
    try {
      await fetch('/api/calls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: activeCallId, status: 'ongoing' })
      });
      setIncomingCall(null);
      setIsCallOngoing(true);
    } catch (e) { }
  };

  const endCall = async () => {
    stopRingtone();
    setIsCallOngoing(false);
    setIsCalling(false);
    setIncomingCall(null);
    try {
      await fetch('/api/calls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: activeCallId, status: 'ended' })
      });
    } catch (e) { }
  };

  const fetchMessages = async (responderId, isPolling = false) => {
    try {
      const res = await fetch(`/api/messages?senderId=${currentUser.id}&receiverId=${responderId}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
        if (isPolling && data.messages.length > 0) {
          const last = data.messages[data.messages.length - 1];
          if (last.id !== lastMessageIdRef.current && Number(last.sender_id) !== Number(currentUser.id)) {
            playNotificationSound();
            if (!isAppActive) {
                showNotification(`New Message from ${selectedSession.responder.name}`, last.message);
            }
            lastMessageIdRef.current = last.id;
            markAsRead(data.sessionId);
          }
        }
      }
    } catch (e) { }
  };

  const markAsRead = async (sessionId) => {
    if (!sessionId) return;
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, receiverId: currentUser.id })
      });
      fetchUnreadCounts();
    } catch (e) { }
  };

  const handleSendMessage = async (e, filePath = null, type = 'text') => {
    if (e) e.preventDefault();
    initAudio();
    if (!messageInput.trim() && !filePath) return;
    const newMessage = {
      sender_id: currentUser.id,
      receiver_id: selectedSession.responder.id,
      message: type === 'text' ? messageInput : 'Shared Asset',
      message_type: type,
      file_path: filePath
    };
    setMessageInput('');
    setMessages(prev => [...prev, { ...newMessage, created_at: new Date().toISOString(), read_at: null }]);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      });
      fetchMessages(selectedSession.responder.id);
    } catch (e) { }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        handleSendMessage(null, data.url, file.type.startsWith('image/') ? 'image' : 'file');
      }
    } catch (e) { alert('Transmission failed'); }
    finally { setUploading(false); }
  };

  if (!currentUser) return null;

  return (
    <main className="relative flex h-screen w-full overflow-hidden text-slate-200 bg-[#02040a]">
      {/* Background Micro-elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[40rem] h-[40rem] bg-sky-500/5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[30rem] h-[30rem] bg-indigo-500/5 blur-[100px] rounded-full animate-pulse delay-1000"></div>
      </div>

      {/* Database Error Alert */}
      {dbError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-red-600/90 backdrop-blur-xl border border-red-500/50 px-8 py-4 rounded-3xl flex items-center gap-4 text-white shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">System Alert</p>
            <p className="text-sm font-bold uppercase italic">Database Terminal Offline: {dbError}</p>
          </div>
          <button onClick={fetchEmployees} className="ml-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Incoming Call Deep Overlay */}
      {incomingCall && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-[40px] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
          <div className="relative mb-12">
            <div className="absolute -inset-10 bg-emerald-500/10 rounded-full blur-3xl animate-ping opacity-30"></div>
            <div className="w-32 h-32 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center relative z-10">
              <User className="w-16 h-16 text-emerald-400" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500/60 mb-2">Priority Mesh Link</p>
          <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-16">{incomingCall.caller_name}</h2>
          <div className="flex gap-16">
            <button onClick={endCall} className="w-20 h-20 rounded-[1.75rem] bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40 hover:scale-110 active:scale-95 transition-all border-b-4 border-red-700">
              <PhoneOff className="w-8 h-8 text-white" />
            </button>
            <button onClick={acceptCall} className="w-20 h-20 rounded-[1.75rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all border-b-4 border-emerald-700">
              <PhoneCall className="w-8 h-8 text-white animate-bounce" />
            </button>
          </div>
        </div>
      )}

      {/* Ongoing Link Bar */}
      {(isCalling || isCallOngoing) && (
        <div className="absolute inset-x-0 top-0 z-[60] p-6 bg-slate-900/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between animate-in slide-in-from-top-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-6 px-4">
            <div className="p-3 bg-sky-500/10 rounded-[1rem] border border-sky-400/30 relative">
              <Radio className="w-6 h-6 text-sky-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black"></div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-sky-500/60 tracking-widest mb-1">{isCalling ? 'Establishing Secure Protocol...' : 'Encrypted Node Active'}</p>
              <p className="text-lg font-black text-white tracking-tight uppercase italic">{isCallOngoing ? 'Direct Mesh Session' : 'Scanning Signals...'}</p>
            </div>
          </div>
          <div className="flex gap-4">
            {isCallOngoing && <button className="p-4 bg-slate-950 border border-white/10 rounded-2xl hover:bg-slate-900 transition-all shadow-inner"><Mic className="w-5 h-5 text-emerald-400" /></button>}
            <button onClick={endCall} className="px-12 py-4 bg-red-600 hover:bg-red-700 rounded-2xl text-[10px] font-black uppercase text-white shadow-2xl shadow-red-500/20 transition-all active:scale-95 border-b-4 border-red-900 tracking-widest">End Transmission</button>
          </div>
        </div>
      )}

      {/* Sidebar - Control Center */}
      <aside className={`w-full md:w-80 lg:w-96 flex-shrink-0 bg-[#080a0f]/40 backdrop-blur-2xl border-r border-white/5 flex flex-col z-20 ${selectedSession ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 md:p-8 border-b border-white/5 bg-slate-900/10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tighter text-white italic">MPCPL MESH</h1>
            </div>
            <div className="flex gap-1.5">
              <button onClick={initAudio} className={`p-2.5 rounded-xl transition-all ${audioInitializedRef.current ? 'text-emerald-400 bg-emerald-500/10' : 'bg-slate-900 text-slate-600'}`}><Speaker className="w-4 h-4" /></button>
              <button onClick={() => Notification.requestPermission().then(p => setNotifPermission(p))} className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl transition-all">
                {notifPermission === 'granted' ? <Zap className="w-4 h-4 text-sky-400" /> : <BellOff className="w-4 h-4 text-slate-600" />}
              </button>
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Personnel..." 
              className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-sky-500/30 transition-all placeholder:text-slate-800 shadow-inner" 
            />
          </div>

          {/* PWA Install Button */}
          {showInstallBtn && (
            <button 
              onClick={() => {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choice) => {
                  if (choice.outcome === 'accepted') setShowInstallBtn(false);
                });
              }}
              className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 p-4 rounded-2xl flex items-center justify-center gap-3 text-white shadow-lg shadow-emerald-500/20 transition-all animate-bounce"
            >
              <DownloadCloud className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Install Mobile App</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          <div className="px-4 pb-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Operational Nodes</div>
          {employees
            .filter(e => e.id !== currentUser.id)
            .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.emp_code.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(emp => (
            <div key={emp.id} onClick={() => { setSelectedSession({ id: emp.id, responder: emp }); setMessages([]); initAudio(); }} className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl md:rounded-3xl cursor-pointer transition-all border ${selectedSession?.responder.id === emp.id ? 'bg-sky-500/10 border-sky-500/20 shadow-2xl' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`}>
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-950 flex items-center justify-center border border-white/5 shadow-inner">
                  <User className={`w-5 h-5 md:w-6 md:h-6 ${unreadCounts[emp.id] ? 'text-sky-400' : 'text-slate-800'}`} />
                </div>
                {unreadCounts[emp.id] > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full border-2 border-black animate-pulse"></span>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-xs md:text-sm tracking-tight text-slate-200 uppercase truncate">{emp.name}</h3>
                <p className="text-[7px] md:text-[9px] text-slate-600 font-black tracking-widest uppercase mt-0.5 opacity-60">Node Active</p>
              </div>
              {unreadCounts[emp.id] > 0 && (
                <div className="bg-sky-500 h-5 px-2 rounded-lg flex items-center justify-center">
                  <span className="text-[9px] font-black text-white">{unreadCounts[emp.id]}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/5 bg-slate-950/40 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center relative">
            <Layers className="w-6 h-6 text-sky-400" />
            <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black truncate text-white uppercase italic leading-none mb-1.5">{currentUser.name}</h4>
            <span className="text-[9px] text-slate-600 font-black tracking-widest uppercase">{currentUser.emp_code}</span>
          </div>
          <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="p-3 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all"><LogOut className="w-4 h-4 text-slate-700 hover:text-red-500" /></button>
        </div>
      </aside>

      {/* Main Command Display */}
      <section className={`flex-1 flex flex-col relative bg-[#010206] ${!selectedSession ? 'hidden md:flex' : 'flex'}`}>
        {selectedSession ? (
          <>
            <header className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-[#04060c]/60 backdrop-blur-3xl z-10 shadow-2xl">
              <div className="flex items-center gap-5">
                <button onClick={() => setSelectedSession(null)} className="md:hidden p-2 text-slate-400"><X className="w-6 h-6" /></button>
                <div className="w-14 h-14 rounded-3xl bg-slate-900 flex items-center justify-center shadow-2xl border border-white/5"><User className="w-7 h-7 text-sky-500" /></div>
                <div>
                  <h2 className="font-black text-white text-lg uppercase italic tracking-tighter">{selectedSession.responder.name}</h2>
                  <p className="text-[9px] text-emerald-500/80 font-black uppercase flex items-center gap-2 mt-1.5 tracking-[0.2em] animate-pulse">
                    <Zap className="w-3 h-3" /> Secure End-to-End Node
                  </p>
                </div>
              </div>
              <div className="flex gap-6 pr-4">
              <div className="flex gap-6 pr-4 opacity-20 pointer-events-none">
                <button title="Voice Call Disabled" className="p-4 bg-slate-950 border border-white/10 rounded-[1.25rem] transition-all text-slate-800 cursor-not-allowed"><Phone className="w-5 h-5" /></button>
                <button title="Video Call Disabled" className="p-4 bg-slate-950 border border-white/10 rounded-[1.25rem] transition-all text-slate-800 cursor-not-allowed"><Video className="w-5 h-5" /></button>
              </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-16 space-y-10 bg-gradient-to-b from-[#02040a] via-[#05080f] to-[#010206]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center grayscale opacity-10 gap-8">
                  <Cpu className="w-24 h-24 stroke-[1px] animate-pulse" />
                  <p className="text-[11px] font-black uppercase tracking-[0.8em]">Establishing Mesh Link...</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${Number(msg.sender_id) === Number(currentUser.id) ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-6 rounded-2xl md:rounded-[2rem] shadow-2xl relative ${Number(msg.sender_id) === Number(currentUser.id) ? 'bg-sky-600/20 border border-sky-400/30 text-white rounded-tr-none' : 'bg-slate-900/60 border border-white/10 text-slate-200 rounded-tl-none'}`}>
                      {msg.message_type === 'image' ? (
                        <img src={msg.file_path} className="max-w-full rounded-xl md:rounded-[1.5rem] mb-2 md:mb-4 border border-white/10 shadow-2xl" alt="Asset" />
                      ) : msg.message_type === 'file' ? (
                        <a href={msg.file_path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 md:gap-5 bg-black/40 p-3 md:p-5 rounded-xl md:rounded-[1.5rem] border border-white/10 hover:bg-black/60 transition-all group backdrop-blur-2xl">
                          <div className="p-2 bg-sky-500/20 rounded-lg group-hover:scale-110 transition-transform"><FileText className="w-5 h-5 md:w-8 md:h-8 text-sky-500" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Encrypted</p>
                            <p className="text-[10px] md:text-xs font-bold truncate text-slate-200">Open File</p>
                          </div>
                        </a>
                      ) : (
                        <p className="text-[13px] md:text-sm font-semibold leading-relaxed tracking-tight">{msg.message}</p>
                      )}
                      <div className="flex items-center justify-end gap-1.5 md:gap-2.5 mt-2 md:mt-4 opacity-40">
                        <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.1em]">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sync'}</span>
                        {Number(msg.sender_id) === Number(currentUser.id) && <CheckCheck className={`w-3 h-3 md:w-4 md:h-4 ${msg.read_at ? 'text-sky-400' : 'text-slate-600'}`} />}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-6 md:p-12 border-t border-white/5 bg-slate-950/80 backdrop-blur-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
              <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto flex items-center gap-5 bg-[#0a0f16] border border-white/10 p-3 rounded-[2rem] focus-within:border-sky-500/40 transition-all shadow-inner relative group">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button type="button" onClick={() => { initAudio(); fileInputRef.current.click(); }} className="p-4 text-slate-600 hover:text-sky-400 hover:bg-sky-500/5 rounded-2xl transition-all">
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin text-sky-500" /> : <Paperclip className="w-6 h-6" />}
                </button>
                <input value={messageInput} onFocus={initAudio} onChange={(e) => setMessageInput(e.target.value)} placeholder="Type encrypted message..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold tracking-tight py-3 placeholder:text-slate-800" />
                <button type="submit" className="bg-sky-500 hover:bg-sky-400 w-16 h-16 flex items-center justify-center rounded-[1.5rem] transition-all shadow-[0_10px_30px_rgba(14,165,233,0.3)] hover:scale-105 active:scale-95 group/btn relative overflow-hidden">
                  <Send className="w-6 h-6 text-white relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent translate-y-full group-hover/btn:translate-y-0 transition-transform"></div>
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="text-center space-y-10 animate-in fade-in zoom-in duration-1000">
            <div className="w-36 h-36 bg-slate-900/50 border border-white/10 flex items-center justify-center rounded-[3.5rem] mx-auto shadow-2xl relative overflow-hidden group">
              <Shield className="w-16 h-16 text-sky-500 z-10 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 to-transparent animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-black uppercase tracking-tighter text-white opacity-90 px-6 italic">MPCPL MESH SECURE</h2>
              <div className="h-1 w-32 bg-sky-500 mx-auto rounded-full opacity-20"></div>
              <p className="text-[12px] text-slate-600 uppercase tracking-[0.8em] font-black opacity-60">Priority Enterprise Command Terminal</p>
            </div>
            <div className="max-w-xs mx-auto grid grid-cols-2 gap-4 pt-10 opacity-20">
              <div className="h-1 bg-white/20 rounded-full"></div>
              <div className="h-1 bg-white/20 rounded-full"></div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
