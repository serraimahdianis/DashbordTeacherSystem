/* eslint-disable @typescript-eslint/no-explicit-any */
import { getToken } from '@/lib/utils';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

type MessageHandler = (data: any) => void;
const listeners = new Map<string, Set<MessageHandler>>();

/** Queue of messages to send once the socket is open */
let pendingMessages: string[] = [];

function handleMessage(event: MessageEvent) {
  try {
    const msg = JSON.parse(event.data);
    const handlers = listeners.get(msg.event);
    if (handlers) {
      for (const handler of handlers) {
        handler(msg.data);
      }
    }
  } catch {
    console.warn('[WS] Failed to parse message');
  }
}

/** Flush any queued messages once the socket is open */
function flushPending(socket: WebSocket) {
  while (pendingMessages.length > 0 && socket.readyState === WebSocket.OPEN) {
    const msg = pendingMessages.shift()!;
    socket.send(msg);
  }
}

function createSocket(token: string): WebSocket {
  const url = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;
  const socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('[WS] Connected');
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    // Flush any messages that were queued while connecting
    flushPending(socket);
  };

  socket.onclose = (event) => {
    console.log(`[WS] Disconnected: code=${event.code} reason="${event.reason || 'none'}"`);
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts++;
      console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      reconnectTimer = setTimeout(() => {
        const t = getToken();
        if (t) {
          ws = createSocket(t);
        }
      }, delay);
    } else {
      console.warn('[WS] Max reconnect attempts reached. Giving up.');
    }
  };

  socket.onerror = () => {
    // WebSocket error events don't carry useful info — the close event that
    // follows will have the actual code/reason. Just log a short notice.
    console.warn('[WS] Connection error (details will follow in close event)');
  };

  socket.onmessage = handleMessage;

  return socket;
}

export function getSocket(): WebSocket | null {
  return ws;
}

export function connectSocket(): WebSocket {
  const token = getToken();
  if (!token) throw new Error('No auth token');

  if (ws && ws.readyState === WebSocket.OPEN) return ws;

  // If there's a stale socket, clean it up
  if (ws) {
    ws.onclose = null; // prevent reconnect from the old socket
    ws.onerror = null;
    ws.close();
  }

  ws = createSocket(token);
  return ws;
}

export function disconnectSocket(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // prevent auto-reconnect
  if (ws) {
    ws.onclose = null;
    ws.onerror = null;
    ws.close();
    ws = null;
  }
  pendingMessages = [];
  listeners.clear();
}

export function on(event: string, handler: MessageHandler): void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(handler);
}

export function off(event: string, handler: MessageHandler): void {
  listeners.get(event)?.delete(handler);
}

/**
 * Send a message to the server. If the socket is still connecting (CONNECTING
 * state), the message is queued and will be flushed once the socket opens.
 * Messages are silently dropped only if the socket is CLOSED/CLOSING.
 */
export function emit(event: string, data: any): void {
  const payload = JSON.stringify({ event, data });

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(payload);
  } else if (ws && ws.readyState === WebSocket.CONNECTING) {
    // Queue for delivery once the socket opens
    pendingMessages.push(payload);
  } else {
    console.warn(`[WS] Cannot send "${event}" — socket not available (state=${ws?.readyState})`);
  }
}

export function joinSessionRoom(sessionId: string): void {
  emit('join:session', sessionId);
}

export function leaveSessionRoom(sessionId: string): void {
  emit('leave:session', sessionId);
}

export function joinTeacherRoom(teacherId: string): void {
  emit('join:teacher', teacherId);
}
