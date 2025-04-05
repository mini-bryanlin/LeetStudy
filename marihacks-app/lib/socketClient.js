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

// Track last join attempt time for throttling
const lastJoinAttempts = new Map(); // roomId-userId -> timestamp

// Debug level - set to true to see debug messages
const DEBUG = true;

// Throttle period for join requests (5 seconds)
const JOIN_THROTTLE_PERIOD = 5000;

// Avoid duplicate join requests by checking timestamps
function shouldThrottleJoin(roomId, userId) {
  const key = `${roomId}-${userId}`;
  const now = Date.now();
  const lastAttempt = lastJoinAttempts.get(key) || 0;
  
  if (now - lastAttempt < JOIN_THROTTLE_PERIOD) {
    debugLog(`Throttling join request for ${userId} to room ${roomId} - too frequent`);
    return true;
  }
  
  lastJoinAttempts.set(key, now);
  return false;
}

function debugLog(...args) {
  if (DEBUG) {
    console.log('[SocketClient]', ...args);
  }
}

// Initialize the socket connection
export function initializeSocket() {
  // Return the existing socket if already initialized
  if (socketInitialized && globalSocket) {
    debugLog('Socket already initialized');
    return Promise.resolve(globalSocket);
  }
  
  // Only create one promise for connection
  if (connectPromise) {
    return connectPromise;
  }

  // Create a new promise for the connection
  connectPromise = new Promise((resolve) => {
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:3031'; // Use port 3031 to match the socket server port

    debugLog('Initializing socket connection to', serverUrl);
    
    globalSocket = io(serverUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    globalSocket.on('connect', () => {
      debugLog('Socket connected with ID:', globalSocket.id);
      socketInitialized = true;
      resolve(globalSocket);
    });

    globalSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      // Still resolve with the socket so the UI can handle the error state
      resolve(globalSocket);
    });

    globalSocket.on('error', (err) => {
      console.error('Socket error:', err);
    });
    
    // If the socket is already connected, resolve immediately
    if (globalSocket.connected) {
      socketInitialized = true;
      resolve(globalSocket);
    }
  });
  
  return connectPromise;
}

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
  const [textAnswers, setTextAnswers] = useState({});
  const [roomOwner, setRoomOwner] = useState(null);
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
    if (!roomId || !user || !user.id) {
      console.log("Missing required data for socket room:", { 
        roomId, 
        userId: user?.id 
      });
      return;
    }
    
    // Initialize the socket if it hasn't been yet
    if (!socketInitialized) {
      const setupSocketWithRetry = async () => {
        try {
          const initializedSocket = await initializeSocket();
          if (initializedSocket) {
            setupRoomEvents(initializedSocket);
          }
        } catch (error) {
          console.error("Failed to initialize socket:", error);
          setError("Failed to connect to socket server");
        }
      };
      
      setupSocketWithRetry();
      return;
    }
    
    // If socket is already initialized, set up events
    if (socket) {
      // Clean up previous event handlers first
      cleanupSocketEvents(socket);
      setupRoomEvents(socket);
    }
    
    // Clean up socket event handlers
    function cleanupSocketEvents(socketInstance) {
      // Define stable event handler references to properly remove them
      const stableHandlers = {
        roomUsersUpdated: (data) => handleRoomUsersUpdated(data),
        roomProgressUpdated: (data) => handleRoomProgressUpdated(data),
        textAnswersUpdated: (data) => handleTextAnswersUpdated(data),
        reconnect: () => handleReconnect()
      };
      
      socketInstance.off('room_users_updated');
      socketInstance.off('room_progress_updated');
      socketInstance.off('text_answers_updated');
      socketInstance.off('connect');
      
      debugLog(`Cleaned up previous socket event listeners for room ${roomId}`);
    }
    
    function setupRoomEvents(socketInstance) {
      debugLog(`Setting up socket room for ${roomId} with user ${user.id}`);
      
      // Check if this user is already in this room's joined users set
      if (!joinedUsers.has(roomId)) {
        joinedUsers.set(roomId, new Set());
      }
      
      const roomJoinedUsers = joinedUsers.get(roomId);
      const alreadyJoined = roomJoinedUsers.has(user.id);
      
      // Create stable event handler that won't recreate on component rerenders
      function handleRoomUsersUpdated(data) {
        if (Array.isArray(data)) {
          console.log(`Received room_users_updated with ${data.length} users:`, 
            data.map(u => u.username));
          dataRef.current.roomUsers = data;
          
          // Check for room owner
          const owner = data.find(u => u.isOwner);
          if (owner) {
            setRoomOwner(owner.id);
          }
          
          // Force a full state update to ensure render
          setRoomUsers([...data]);
        } else {
          console.log(`Received invalid room_users_updated:`, data);
        }
      }
      
      function handleRoomProgressUpdated(data) {
        console.log(`Received room_progress_updated for room ${dataRef.current.roomId}:`, data);
        if (Array.isArray(data)) {
          console.log(`Progress data is an array with ${data.length} items`);
          dataRef.current.roomProgress = data;
          setRoomProgress([...data]);
        } else if (data?.progress && Array.isArray(data.progress)) {
          console.log(`Progress data has progress array with ${data.progress.length} items`);
          dataRef.current.roomProgress = data.progress;
          setRoomProgress([...data.progress]);
        } else {
          console.log(`Received invalid room_progress_updated data:`, data);
        }
      }
      
      function handleTextAnswersUpdated(data) {
        if (data && typeof data === 'object') {
          console.log(`Received text_answers_updated:`, data);
          setTextAnswers(data);
        }
      }
      
      // Join the room if not already joined
      if ((!alreadyJoined || Date.now() - dataRef.current.joinTimestamp > 60000) && socketInstance.connected) {
        // Add throttling check
        if (shouldThrottleJoin(roomId, user.id)) {
          console.log(`Join request throttled for ${user.username} (${user.id}) to room ${roomId}`);
        } else {
          console.log(`Joining room ${roomId} as ${user.username} (${user.id})`);
          
          socketInstance.emit('join_room', { roomId, username: user.username });
          roomJoinedUsers.add(user.id);
          
          // Store the join info for reconnection
          connectedRooms.set(roomId, { 
            user, 
            timestamp: Date.now() 
          });
          
          // Update join timestamp
          dataRef.current.joinTimestamp = Date.now();
        }
      } 
      
      // First remove any existing handlers to prevent duplicates
      cleanupSocketEvents(socketInstance);
      
      // Attach event handlers
      socketInstance.on('room_users_updated', handleRoomUsersUpdated);
      socketInstance.on('room_progress_updated', handleRoomProgressUpdated);
      socketInstance.on('text_answers_updated', handleTextAnswersUpdated);
      
      // Auto-rejoin on reconnect
      function handleReconnect() {
        console.log(`Reconnected, rejoining room ${roomId}`);
        
        // Add throttling check for reconnect too
        if (shouldThrottleJoin(roomId, user.id)) {
          console.log(`Reconnection join request throttled for ${user.username} (${user.id})`);
          return; // Skip this join attempt
        }
        
        socketInstance.emit('join_room', { roomId, username: user.username });
        
        // Update the join timestamp
        if (connectedRooms.has(roomId)) {
          connectedRooms.set(roomId, {
            user,
            timestamp: Date.now()
          });
        }
        
        // Update join timestamp in ref
        dataRef.current.joinTimestamp = Date.now();
        
        setReconnecting(false);
      }
      
      socketInstance.on('connect', handleReconnect);
      
      return () => {
        cleanupSocketEvents(socketInstance);
      };
    }
    
    // Clean up event listeners when component unmounts
    return () => {
      console.log(`Component unmounting, cleaning up socket event listeners for room ${roomId}`);
      if (socket) {
        cleanupSocketEvents(socket);
      }
    };
  }, [roomId, user, socket, connected]);
  
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
  
  // Function to submit a text answer
  const submitTextAnswer = useCallback(
    debounce((answer, questionIndex) => {
      if (socket && socket.connected && dataRef.current.roomId) {
        socket.emit('submit_text_answer', { 
          roomId: dataRef.current.roomId, 
          answer,
          questionIndex
        });
      }
    }, 300),
    [socket]
  );
  
  // Function to skip the current question (owner only)
  const skipQuestion = useCallback(
    debounce(() => {
      if (socket && socket.connected && dataRef.current.roomId) {
        socket.emit('skip_question', { 
          roomId: dataRef.current.roomId
        });
      }
    }, 300),
    [socket]
  );
  
  return {
    roomUsers,
    roomProgress,
    textAnswers,
    roomOwner,
    isOwner: user?.id === roomOwner,
    sendAnswerEvent,
    sendQuizCompletedEvent,
    submitTextAnswer,
    skipQuestion,
    socket,
    reconnecting,
    reconnectAttempts,
    error
  };
} 