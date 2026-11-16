import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

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
        console.log('[Web Socket] Conectado en tiempo real al servidor POS:', socket?.id);
      });

      socket.on('disconnect', () => {
        console.log('[Web Socket] Desconectado del servidor POS');
      });
    }
    return socket!;
  };

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
    onEvent,
    offEvent
  };
};

