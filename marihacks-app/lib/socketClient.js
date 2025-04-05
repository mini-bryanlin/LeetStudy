"use client";

import { io } from 'socket.io-client';
import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';

// Create socket context
const SocketContext = createContext(null);

// Global socket instance to ensure a single connection across the app
let globalSocket = null;
let socketInitialized = false;
let connectedRooms = new Map(); // roomId -> { userId, timestamp }
let connectPromise = null;

// Track users who have joined rooms
const joinedUsers = new Map(); // roomId -> Set of userIds

// Debug level - set to true to see debug messages
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log('[SocketClient]', ...args);
  }
}

// Determine the socket URL based on environment
const getSocketUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return window.location.origin;
  }
  
  // For development use, connect to the separate socket server on port 3030
  return window.location.hostname === 'localhost'
    ? `http://${window.location.hostname}:3030`
    : window.location.origin;
};

// Initialize the global socket with stable connection handling
const initializeSocket = () => {
  if (socketInitialized) return globalSocket;
  
  if (!connectPromise) {
    connectPromise = new Promise((resolve) => {
      console.log('Creating new global socket connection');
      
      globalSocket = io(getSocketUrl(), {
        transports: ['websocket'],
        autoConnect: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 20000
      });
      
      const onConnect = () => {
        console.log('Socket connected globally:', globalSocket.id);
        socketInitialized = true;
        resolve(globalSocket);
        
        // Rejoin any rooms we were in before disconnect
        connectedRooms.forEach((data, roomId) => {
          if (Date.now() - data.timestamp < 300000) { // Only rejoin rooms joined in the last 5 minutes
            console.log(`Auto-rejoining room ${roomId} after reconnect`);
            globalSocket.emit('join_room', { roomId, user: data.user });
          } else {
            connectedRooms.delete(roomId);
          }
        });
      };
      
      globalSocket.on('connect', onConnect);
      
      if (globalSocket.connected) {
        onConnect();
      }
      
      globalSocket.on('disconnect', () => {
        console.log('Socket disconnected globally');
      });
      
      globalSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    });
  }
  
  return connectPromise;
};

// Simple debounce function to prevent rapid repeated calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    // Initialize socket only once
    if (!socketInitialized) {
      initializeSocket().then(socket => {
        setSocket(socket);
        setConnected(socket.connected);
      });
    } else if (globalSocket) {
      setSocket(globalSocket);
      setConnected(globalSocket.connected);
    }
    
    // Set up connect/disconnect handlers for UI state
    const handleConnect = () => {
      setConnected(true);
    };
    
    const handleDisconnect = () => {
      setConnected(false);
    };
    
    if (globalSocket) {
      globalSocket.on('connect', handleConnect);
      globalSocket.on('disconnect', handleDisconnect);
      
      return () => {
        globalSocket.off('connect', handleConnect);
        globalSocket.off('disconnect', handleDisconnect);
      };
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

// Hook to use socket in components
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Hook to join a specific room - FIXED VERSION
export function useSocketRoom(roomId, user) {
  const { socket, connected } = useSocket();
  const [roomUsers, setRoomUsers] = useState([]);
  const [roomProgress, setRoomProgress] = useState([]);
  const [error, setError] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  // Use refs to prevent infinite update loops
  const dataRef = useRef({
    roomId,
    user,
    roomUsers: [],
    roomProgress: [],
    isSetup: false,
    joinTimestamp: Date.now()
  });
  
  // Keep the ref updated with latest props
  dataRef.current.roomId = roomId;
  dataRef.current.user = user;
  
  // Debug log the current users list
  useEffect(() => {
    console.log(`Current roomUsers state (${roomUsers.length} users):`, 
      roomUsers.map(u => u.username));
  }, [roomUsers]);
  
  // Setup event listeners only once
  useEffect(() => {
    if (!socket || !roomId || !user || !user.id) {
      console.log("Missing required data for socket room:", { 
        socket: !!socket, 
        roomId, 
        userId: user?.id 
      });
      return;
    }
    
    // Initialize the socket if it hasn't been yet
    if (!socketInitialized) {
      initializeSocket();
      return; // Wait for next render when socket is initialized
    }
    
    console.log(`Setting up socket room for ${roomId} with user ${user.id}`);
    
    // Check if this user is already in this room's joined users set
    if (!joinedUsers.has(roomId)) {
      joinedUsers.set(roomId, new Set());
    }
    
    const roomJoinedUsers = joinedUsers.get(roomId);
    const alreadyJoined = roomJoinedUsers.has(user.id);
    
    // Create a stable event handler that won't recreate on component rerenders
    const handleRoomUsersUpdated = (data) => {
      if (data?.users && Array.isArray(data.users)) {
        console.log(`Received room_users_updated with ${data.users.length} users:`, 
          data.users.map(u => u.username));
        dataRef.current.roomUsers = data.users;
        
        // Force a full state update to ensure render
        setRoomUsers([...data.users]);
      } else {
        console.log(`Received invalid room_users_updated:`, data);
      }
    };
    
    const handleRoomProgressUpdated = (data) => {
      if (data?.progress && Array.isArray(data.progress)) {
        console.log(`Received room_progress_updated with ${data.progress.length} items`);
        dataRef.current.roomProgress = data.progress;
        setRoomProgress([...data.progress]);
      } else {
        console.log(`Received invalid room_progress_updated:`, data);
      }
    };
    
    // Join the room if not already joined
    if (!alreadyJoined && socket.connected) {
      console.log(`Joining room ${roomId} as ${user.username} (${user.id})`);
      socket.emit('join_room', { roomId, user });
      roomJoinedUsers.add(user.id);
      
      // Store the join info for reconnection
      connectedRooms.set(roomId, { 
        user, 
        timestamp: Date.now() 
      });
    } else {
      console.log(`Already joined room ${roomId} or socket not connected, reconnecting`);
      // Try to rejoin to get latest state
      socket.emit('join_room', { roomId, user });
    }
    
    // First removal of existing handlers to prevent duplicates
    socket.off('room_users_updated', handleRoomUsersUpdated);
    socket.off('room_progress_updated', handleRoomProgressUpdated);
    
    // Attach event handlers
    socket.on('room_users_updated', handleRoomUsersUpdated);
    socket.on('room_progress_updated', handleRoomProgressUpdated);
    
    // Auto-rejoin on reconnect
    const handleReconnect = () => {
      console.log(`Reconnected, rejoining room ${roomId}`);
      socket.emit('join_room', { roomId, user });
      
      // Update the join timestamp
      if (connectedRooms.has(roomId)) {
        connectedRooms.set(roomId, {
          user,
          timestamp: Date.now()
        });
      }
    };
    
    socket.on('connect', handleReconnect);
    
    // Check for existing room users data and request an update if needed
    if ((!roomUsers || roomUsers.length === 0) && socket.connected) {
      // Request a refresh of room data
      console.log(`Requesting room data refresh for ${roomId}`);
      socket.emit('join_room', { roomId, user });
    }
    
    dataRef.current.isSetup = true;
    
    // Cleanup function
    return () => {
      console.log(`Cleaning up event handlers for room ${roomId}`);
      socket.off('room_users_updated', handleRoomUsersUpdated);
      socket.off('room_progress_updated', handleRoomProgressUpdated);
      socket.off('connect', handleReconnect);
      
      // Don't leave the room on unmount to ensure persistent connection
      // The server will handle timeouts and cleanup
    };
  }, [socket, roomId, user?.id, roomUsers?.length]); // Add roomUsers.length to handle empty state
  
  // Debounced event emitters that use refs for current data
  const sendAnswerEvent = useCallback(
    debounce((questionIndex, isCorrect) => {
      if (socket && socket.connected && dataRef.current.roomId) {
        socket.emit('question_answered', { 
          roomId: dataRef.current.roomId, 
          questionIndex, 
          isCorrect 
        });
      }
    }, 300),
    [socket]
  );
  
  const sendQuizCompletedEvent = useCallback(
    debounce((score, totalQuestions) => {
      if (socket && socket.connected && dataRef.current.roomId) {
        socket.emit('quiz_completed', { 
          roomId: dataRef.current.roomId, 
          score, 
          totalQuestions 
        });
      }
    }, 300),
    [socket]
  );
  
  return {
    roomUsers,
    roomProgress,
    sendAnswerEvent,
    sendQuizCompletedEvent
  };
} 