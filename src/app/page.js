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
  const lastCheckedCountRef = useRef(0);
  useEffect(() => {
    if (!currentUser) return;
    
    const checkGlobal = async () => {
      try {
        const res = await fetch(`/api/messages/unread?receiverId=${currentUser.id}`);
        const data = await res.json();
        if (data.success && data.counts) {
          const totalNew = data.counts.reduce((a, b) => a + b.unread_count, 0);
          
          if (totalNew > lastCheckedCountRef.current) {
             // New message arrived globally!
             const latest = data.counts.sort((a,b) => b.unread_count - a.unread_count)[0];
             const sender = employees.find(e => Number(e.id) === Number(latest.sender_id));
             const senderName = sender ? sender.name : "Personnel";

             playNotificationSound(); 
             if (!isAppActive) {
                showNotification(`Message from ${senderName}`, latest.last_message || "Priority update received.");
             }
          }
          lastCheckedCountRef.current = totalNew;
          fetchUnreadCounts(); 
        }
      } catch (e) {}
    };

    const interval = setInterval(checkGlobal, 4000);
    return () => clearInterval(interval);
  }, [currentUser, isAppActive, employees]);

  // Heartbeat to keep current user online
  useEffect(() => {
    if (!currentUser) return;
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });
      } catch (e) {}
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [currentUser]);

  const isUserOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const last = new Date(lastSeen).getTime();
    const now = new Date().getTime();
    return (now - last) < 65000; // Online if updated in last 65 seconds
  };

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
    <main className="relative flex h-screen w-full overflow-hidden text-[#e9edef] bg-[#0b141a]">
      {/* WhatsApp Background Pattern Logic */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/580/630/wallpaper-whatsapp-dark-mode.jpg")', backgroundSize: '400px' }}></div>

      {/* HTTPS Warning for PWA/Notifications */}
      {typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
        <div className="fixed bottom-4 left-4 right-4 z-[200] bg-amber-600/90 backdrop-blur-xl border border-amber-500/50 p-4 rounded-2xl flex items-center gap-3 text-white shadow-2xl animate-in slide-in-from-bottom-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-[9px] font-bold uppercase tracking-tight">Security Alert: Encrypted Notifications & PWA Installation require an **HTTPS** connection. Current unsecured protocol (HTTP) may limit features.</p>
        </div>
      )}

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

      {/* Sidebar - WhatsApp Style */}
      <aside className={`w-full md:w-[400px] flex-shrink-0 bg-[#111b21] border-r border-[#222d34] flex flex-col z-20 ${selectedSession ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 bg-[#202c33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#374248] flex items-center justify-center">
              <User className="w-6 h-6 text-[#aebac1]" />
            </div>
            <h1 className="text-lg font-bold text-[#e9edef]">Chats</h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={async () => {
                const p = await requestNotificationPermission();
                setNotifPermission(p);
                initAudio();
              }} 
              className={`hover:scale-110 transition-transform ${notifPermission === 'granted' ? 'text-[#25D366]' : 'text-[#aebac1]'}`}
              title="Notification Settings"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={initAudio} className="text-[#aebac1] hover:text-[#e9edef]"><Speaker className="w-5 h-5" /></button>
            <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="text-[#aebac1] hover:text-[#ef4444]"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-2 border-b border-[#222d34]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or start new chat" 
              className="w-full bg-[#202c33] rounded-lg py-2 pl-12 pr-4 text-sm text-[#e9edef] focus:outline-none placeholder:text-[#8696a0]" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {employees
            .filter(e => e.id !== currentUser.id)
            .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.emp_code.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(emp => (
            <div key={emp.id} onClick={() => { setSelectedSession({ id: emp.id, responder: emp }); setMessages([]); initAudio(); }} className={`flex items-center gap-3 p-3 cursor-pointer transition-all ${selectedSession?.responder.id === emp.id ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`}>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#374248] flex items-center justify-center border border-[#222d34]">
                  <User className={`w-7 h-7 ${unreadCounts[emp.id] ? 'text-[#25D366]' : 'text-[#8696a0]'}`} />
                </div>
                {isUserOnline(emp.last_seen) && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#25D366] rounded-full border-2 border-[#111b21]"></span>}
              </div>
              <div className="flex-1 min-w-0 border-b border-[#222d34] pb-3">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-[16px] text-[#e9edef] truncate">{emp.name}</h3>
                  <span className="text-[12px] text-[#8696a0]">{isUserOnline(emp.last_seen) ? 'Online' : 'Offline'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-[#8696a0] truncate opacity-80">Tap to start secure chat</p>
                  {unreadCounts[emp.id] > 0 && (
                    <div className="bg-[#25D366] min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                      <span className="text-[11px] font-bold text-[#111b21]">{unreadCounts[emp.id]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area - WhatsApp Style */}
      <section className={`flex-1 flex flex-col relative bg-[#0b141a] z-10 ${!selectedSession ? 'hidden md:flex' : 'flex'}`}>
        {selectedSession ? (
          <>
            <header className="p-3 bg-[#202c33] flex items-center justify-between border-l border-[#222d34]">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedSession(null)} className="md:hidden p-2 text-[#aebac1]"><X className="w-6 h-6" /></button>
                <div className="w-10 h-10 rounded-full bg-[#374248] flex items-center justify-center"><User className="w-6 h-6 text-[#8696a0]" /></div>
                <div>
                  <h2 className="font-bold text-[#e9edef] text-md">{selectedSession.responder.name}</h2>
                  <p className={`text-[12px] ${isUserOnline(selectedSession.responder.last_seen) ? 'text-[#25D366]' : 'text-[#8696a0]'}`}>
                    {isUserOnline(selectedSession.responder.last_seen) ? 'online' : 'offline'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-[#aebac1]">
                <button className="p-2 hover:bg-[#374248] rounded-full transition-all"><Search className="w-5 h-5 text-[#8696a0]" /></button>
                <div className="flex gap-4 opacity-30 pointer-events-none">
                   <button className="p-2"><Phone className="w-5 h-5" /></button>
                   <button className="p-2"><Video className="w-5 h-5" /></button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 relative">
               {/* Background Pattern Overlay */}
               <div className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/580/630/wallpaper-whatsapp-dark-mode.jpg")', backgroundSize: '400px' }}></div>
               
               <div className="relative z-10 space-y-2">
                {messages.length === 0 ? (
                    <div className="h-full mt-20 flex items-center justify-center opacity-40">
                    <p className="bg-[#182229] px-4 py-1.5 rounded-lg text-xs uppercase tracking-widest text-[#8696a0]">Encryption Active</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${Number(msg.sender_id) === Number(currentUser.id) ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-1.5 rounded-lg shadow-md relative ${Number(msg.sender_id) === Number(currentUser.id) ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#202c33] text-[#e9edef]'}`}>
                        {msg.message_type === 'image' ? (
                            <div className="p-1"><img src={msg.file_path} className="max-w-full rounded-md" alt="Asset" /></div>
                        ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px] text-[#8696a0]">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Syncing'}</span>
                            {Number(msg.sender_id) === Number(currentUser.id) && (
                            <CheckCheck className={`w-3.5 h-3.5 ${msg.read_at ? 'text-[#53bdeb]' : 'text-[#8696a0]'}`} />
                            )}
                        </div>
                        </div>
                    </div>
                    ))
                )}
                <div ref={messagesEndRef} />
               </div>
            </div>

            <footer className="p-2.5 bg-[#202c33] flex items-center gap-3">
              <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 text-[#aebac1] hover:text-[#e9edef]"><Paperclip className="w-6 h-6" /></button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-3">
                  <input 
                    value={messageInput} 
                    onFocus={initAudio} 
                    onChange={(e) => setMessageInput(e.target.value)} 
                    placeholder="Type a message" 
                    className="flex-1 bg-[#2a3942] rounded-lg py-2.5 px-4 text-sm text-[#e9edef] focus:outline-none" 
                  />
                  <button 
                    type="submit"
                    className="p-2.5 bg-[#00a884] rounded-full text-white hover:bg-[#008f6f] transition-all"
                  >
                    <Send className="w-5 h-5 fill-current" />
                  </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-[#222d34] border-l border-[#2e3b44] text-center px-10">
            <div className="w-32 h-32 opacity-10 mb-8"><Cpu className="w-full h-full" /></div>
            <h2 className="text-3xl font-light text-[#e9edef] opacity-80 mb-4">MPCPL Web</h2>
            <p className="max-w-md text-[#8696a0] text-sm leading-relaxed">
              Send and receive messages without keeping your phone online.<br/>
              Use MPCPL on up to 4 linked devices and 1 phone at the same time.
            </p>
            <div className="mt-20 text-[12px] text-[#8696a0] flex items-center gap-2">
              <Shield className="w-3 h-3" /> End-to-end encrypted
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
