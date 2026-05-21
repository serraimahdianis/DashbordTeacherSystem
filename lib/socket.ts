import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: { token: getToken() },
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket!.id);
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
    });

    socket.on('attendance:fraud-alert', (data: { sessionId: string; studentId: string; reason: string; riskScore: number }) => {
      console.warn('[Socket.IO] Fraud alert:', data);
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token: getToken() };
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

export function joinSessionRoom(sessionId: string): void {
  const s = connectSocket();
  s.emit('join:session', sessionId);
}

export function leaveSessionRoom(sessionId: string): void {
  if (socket?.connected) {
    socket.emit('leave:session', sessionId);
  }
}

export function joinTeacherRoom(teacherId: string): void {
  const s = connectSocket();
  s.emit('join:teacher', teacherId);
}
