import { useState, useEffect, useRef } from 'react';
import * as Colyseus from 'colyseus.js';

const useColyseus = (serverUrl = 'ws://localhost:3001', roomName = 'two_keys') => {
  const [room, setRoom] = useState(null);
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [myRole, setMyRole] = useState(null);
  const [sessionCode, setSessionCode] = useState(null);
  const sessionCodeRef = useRef(null);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new Colyseus.Client(serverUrl);
    }
  }, [serverUrl]);

  const createRoom = async (options = {}) => {
    try {
      const joinedRoom = await clientRef.current.create(roomName, {
        levelId: options.levelId || 1,
        ...options
      });

      setupRoom(joinedRoom);
      return joinedRoom;
    } catch (e) {
      console.error('Error creating room:', e);
      setError(e);
      throw e;
    }
  };

  const joinRoom = async (roomId, options = {}) => {
    try {
      const joinedRoom = await clientRef.current.joinById(roomId, options);
      setupRoom(joinedRoom);
      return joinedRoom;
    } catch (e) {
      console.error('Error joining room:', e);
      setError(e);
      throw e;
    }
  };

  const joinOrCreateRoom = async (options = {}) => {
    try {
      const joinedRoom = await clientRef.current.joinOrCreate(roomName, {
        levelId: options.levelId || 1,
        ...options,
      });
      setupRoom(joinedRoom);
      return joinedRoom;
    } catch (e) {
      console.error('Error joinOrCreate room:', e);
      setError(e);
      throw e;
    }
  };

  const joinByCode = async (code, options = {}) => {
    try {
      // Find room by session code
      const rooms = await clientRef.current.getAvailableRooms(roomName);
      const targetRoom = rooms.find(r => r.metadata?.sessionCode === code);

      if (!targetRoom) {
        throw new Error('Room not found with that code');
      }

      return await joinRoom(targetRoom.roomId, options);
    } catch (e) {
      console.error('Error joining by code:', e);
      setError(e);
      throw e;
    }
  };

  const setupRoom = (joinedRoom) => {
    setRoom(joinedRoom);
    setConnected(true);
    // set initial state immediately to avoid null renders
    if (joinedRoom.state) {
      setState(joinedRoom.state);
      if (joinedRoom.state.sessionCode && !sessionCodeRef.current) {
        sessionCodeRef.current = joinedRoom.state.sessionCode;
        setSessionCode(joinedRoom.state.sessionCode);
      }
    }

    // State change handler
    joinedRoom.onStateChange((newState) => {
      setState(newState);
      // ensure session code is populated even if role_assigned message was missed
      if (newState?.sessionCode && !sessionCodeRef.current) {
        sessionCodeRef.current = newState.sessionCode;
        setSessionCode(newState.sessionCode);
      }
    });

    // Message handlers
    joinedRoom.onMessage('role_assigned', (data) => {
      console.log('Role assigned:', data.role);
      setMyRole(data.role);
      if (data.sessionCode) {
        sessionCodeRef.current = data.sessionCode;
        setSessionCode(data.sessionCode);
      }
    });

    joinedRoom.onMessage('room_full', (data) => {
      setError(new Error(data.message));
    });

    // Optional info messages (avoid console errors if broadcast without handler)
    joinedRoom.onMessage('both_players_connected', () => {});

    // Error handler
    joinedRoom.onError((code, message) => {
      console.error('Room error:', code, message);
      setError({ code, message });
    });

    // Leave handler
    joinedRoom.onLeave((code) => {
      console.log('Left room with code:', code);
      setConnected(false);
      setRoom(null);
    });
  };

  const sendMessage = (type, data = {}) => {
    if (room) {
      room.send(type, data);
    }
  };

  const leaveRoom = () => {
    if (room) {
      room.leave();
      setRoom(null);
      setConnected(false);
      setMyRole(null);
      setSessionCode(null);
    }
  };

  return {
    room,
    state,
    error,
    connected,
    myRole,
    sessionCode,
    createRoom,
    joinRoom,
    joinOrCreateRoom,
    joinByCode,
    sendMessage,
    leaveRoom
  };
};

export default useColyseus;
