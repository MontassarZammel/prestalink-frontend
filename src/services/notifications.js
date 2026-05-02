// Browser notifications + sound

const ICON = '/vite.svg';

export const requestPermission = async () => {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
};

export const showNotification = (title, body, onClick) => {
  if (Notification.permission !== 'granted') return;
  const n = new Notification(title, { body, icon: ICON, badge: ICON, silent: false });
  if (onClick) n.onclick = () => { window.focus(); onClick(); n.close(); };
  setTimeout(() => n.close(), 6000);
};

// Simple beep via Web Audio API — no external file needed
export const playNotifSound = (type = 'message') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'message') {
      // Two-tone "ding" like Messenger
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Simple pop for reply
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (_) {}
};
