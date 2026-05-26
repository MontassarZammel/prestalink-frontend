import { io } from 'socket.io-client';

let socket = null;

const readToken = () => {
  try {
    const { state } = JSON.parse(localStorage.getItem('prestalink-auth') || '{}');
    return state?.token || null;
  } catch (_) { return null; }
};

export const getSocket = () => {
  if (!socket) {
    const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    socket = io(BACKEND, {
      auth: { token: readToken() },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socket.on('connect', () => console.log('🔌 Socket connected'));
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
  }
  return socket;
};

export const reconnectSocket = () => {
  if (!socket) return getSocket();
  // Reconnect same instance with updated token (components keep their reference)
  socket.auth = { token: readToken() };
  socket.disconnect().connect();
  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
