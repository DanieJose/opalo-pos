import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
const isConnected = ref(false);

export const useSocket = () => {
  const config = useRuntimeConfig();
  // Obtener URL base del backend sin '/api/v1'
  const backendUrl = (config.public.apiBase as string).replace(/\/api\/v1\/?$/, '');

  const getSocket = (): Socket => {
    if (!socket && process.client) {
      socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        isConnected.value = true;
        console.log('[Web Socket] Conectado en tiempo real al servidor POS:', socket?.id);
      });

      socket.on('disconnect', () => {
        isConnected.value = false;
        console.log('[Web Socket] Desconectado del servidor POS');
      });

      socket.on('connect_error', (err) => {
        isConnected.value = false;
        console.warn('[Web Socket] Error de conexión:', err);
      });
    }
    return socket!;
  };

  // Inicializar en cliente si aún no está inicializado
  if (process.client && !socket) {
    getSocket();
  }

  const onEvent = (event: string, callback: (...args: any[]) => void) => {
    if (process.client) {
      const s = getSocket();
      s.on(event, callback);
    }
  };

  const offEvent = (event: string, callback?: (...args: any[]) => void) => {
    if (socket && process.client) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
  };

  return {
    getSocket,
    isConnected,
    onEvent,
    offEvent
  };
};
