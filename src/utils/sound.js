let ringtoneInterval = null;

export const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const context = new AudioContext();
        const playTone = (freq, startTime, duration, vol) => {
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            osc.connect(gain);
            gain.connect(context.destination);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        const now = context.currentTime;
        playTone(880, now, 0.4, 0.8);
        playTone(1320, now + 0.1, 0.4, 0.6);
    } catch (e) {}
};

export const startRingtone = () => {
    if (ringtoneInterval) return;
    // Play initial immediately
    playNotificationSound();
    // Loop every 1.5 seconds for true ringtone feel
    ringtoneInterval = setInterval(() => {
        playNotificationSound();
    }, 1500);
};

export const stopRingtone = () => {
    if (ringtoneInterval) {
        clearInterval(ringtoneInterval);
        ringtoneInterval = null;
    }
};
