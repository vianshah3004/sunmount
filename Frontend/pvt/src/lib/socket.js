import { io } from 'socket.io-client';

let socket = null;
let socketHealthy = false;
const connectionListeners = new Set();

const notifyConnectionListeners = (connected) => {
  socketHealthy = connected;
  connectionListeners.forEach((listener) => {
    try {
      listener(connected);
    } catch (_error) {
      // Keep broadcasting state even if one callback fails.
    }
  });
};

export function initSocket() {
  if (socket) {
    return socket;
  }

  const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || window.location.origin;

  socket = io(socketUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 8000,
  });

  socket.on('connect', () => {
    notifyConnectionListeners(true);
  });

  socket.on('disconnect', () => {
    notifyConnectionListeners(false);
  });

  socket.on('connect_error', () => {
    notifyConnectionListeners(false);
  });

  return socket;
}

export function getSocket() {
  if (!socket) {
    return initSocket();
  }
  return socket;
}

export function onInventoryUpdate(callback) {
  const socketInstance = getSocket();
  socketInstance.on('inventory:update', callback);
  
  return () => {
    socketInstance.off('inventory:update', callback);
  };
}

export function onSocketConnectionChange(callback) {
  connectionListeners.add(callback);
  callback(socketHealthy);
  return () => {
    connectionListeners.delete(callback);
  };
}

export function isSocketHealthy() {
  return socketHealthy;
}

export function createPollingFallback(callback, intervalMs = 12000) {
  let timerId = null;

  const run = async () => {
    try {
      await callback();
    } catch (_error) {
      // Primary request path handles surfaced API errors.
    }
  };

  const stop = () => {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  const start = () => {
    if (timerId) {
      return;
    }
    timerId = window.setInterval(() => {
      void run();
    }, intervalMs);
  };

  return {
    start,
    stop,
    run,
  };
}

export function onLowStock(callback) {
  const socketInstance = getSocket();
  socketInstance.on('low_stock', callback);
  
  return () => {
    socketInstance.off('low_stock', callback);
  };
}

export function onOrderUpdate(callback) {
  const socketInstance = getSocket();
  socketInstance.on('order:update', callback);
  
  return () => {
    socketInstance.off('order:update', callback);
  };
}

export function onOrderCreated(callback) {
  const socketInstance = getSocket();
  socketInstance.on('order:created', callback);
  
  return () => {
    socketInstance.off('order:created', callback);
  };
}

export function onOrderStatusChanged(callback) {
  const socketInstance = getSocket();
  socketInstance.on('order:statusChanged', callback);
  
  return () => {
    socketInstance.off('order:statusChanged', callback);
  };
}

export function onManufacturingUpdate(callback) {
  const socketInstance = getSocket();
  socketInstance.on('manufacturing:update', callback);
  
  return () => {
    socketInstance.off('manufacturing:update', callback);
  };
}
