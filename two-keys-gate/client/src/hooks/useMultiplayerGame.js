import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_ROOM = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ROOM_CODE) || 'ROOM1';

const buildApiUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const useMultiplayerGame = (preferredRole = null, roomCode = DEFAULT_ROOM) => {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [myRole, setMyRole] = useState(null);
  const clientIdRef = useRef(null);
  const pollRef = useRef(null);
  const apiBase = useMemo(buildApiUrl, []);

  const clientId = useMemo(() => {
    if (clientIdRef.current) return clientIdRef.current;
    const stored = typeof window !== 'undefined' ? localStorage.getItem('twokeys-client-id') : null;
    const id = stored || generateId();
    if (typeof window !== 'undefined') {
      localStorage.setItem('twokeys-client-id', id);
    }
    clientIdRef.current = id;
    return id;
  }, []);

  const deriveRole = (roomState) => {
    if (!roomState) return null;
    if (roomState.playerA?.sessionId === clientId) return 'A';
    if (roomState.playerB?.sessionId === clientId) return 'B';
    return null;
  };

  const fetchState = async () => {
    try {
      const res = await fetch(`${apiBase}/rooms/${roomCode}`);
      if (!res.ok) throw new Error(`State fetch failed: ${res.status}`);
      const data = await res.json();
      setState(data);
      setConnected(true);
      setError(null);
      setMyRole(deriveRole(data));
    } catch (e) {
      console.error('State poll error:', e);
      setError(e);
      setConnected(false);
    }
  };

  useEffect(() => {
    fetchState();
    pollRef.current = setInterval(fetchState, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, roomCode]);

  const post = async (path, body = {}) => {
    try {
      const res = await fetch(`${apiBase}/rooms/${roomCode}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, clientId }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Request failed ${res.status}`);
      }
      const data = await res.json();
      setState(data);
      setMyRole(deriveRole(data));
      setConnected(true);
      setError(null);
      return data;
    } catch (e) {
      console.error(`POST ${path} error:`, e);
      setError(e);
      throw e;
    }
  };

  // Auto-claim preferred role once if available
  useEffect(() => {
    if (!preferredRole || !state || myRole) return;
    const seat = preferredRole.toUpperCase();
    const seatTaken =
      seat === 'A' ? state.playerA?.sessionId : seat === 'B' ? state.playerB?.sessionId : null;
    if (!seatTaken) {
      post('/claim', { role: seat }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredRole, state, myRole]);

  const sendRelease = useCallback(
    async (payload = {}) => {
      const body = JSON.stringify({ ...payload, clientId });
      const url = `${apiBase}/rooms/${roomCode}/release`;

      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon(url, blob);
          return;
        }

        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      } catch (e) {
        console.warn('Release request failed', e);
      }
    },
    [apiBase, roomCode, clientId]
  );

  const claimRole = (role) => post('/claim', { role });
  const releaseRole = (role) => post('/release', { role });
  const setReady = (ready = true) => post('/ready', { ready });
  const startCountdown = () => post('/start');

  const sendMessage = (type, payload = {}) => {
    switch (type) {
      case 'select_answer':
        return post('/select', { answer: payload.answer || [] });
      case 'confirm_answer':
        return post('/confirm');
      case 'chat_message':
        return post('/chat', { text: payload.text || '' });
      case 'player_ready':
        return setReady(true);
      case 'start_request':
        return startCountdown();
      case 'request_exit':
        return post('/exit-request');
      case 'cancel_exit':
        return post('/exit-cancel');
      default:
        return Promise.resolve();
    }
  };

  const leaveRoom = useCallback(() => {
    sendRelease();
    setConnected(false);
    setMyRole(null);
  }, [sendRelease]);

  useEffect(() => {
    const handleUnload = () => {
      sendRelease();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleUnload);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleUnload);
      }
    };
  }, [sendRelease]);

  return {
    room: null,
    state,
    error,
    connected,
    myRole,
    sessionCode: state?.sessionCode || roomCode,
    claimRole,
    releaseRole,
    setReady,
    startCountdown,
    sendMessage,
    leaveRoom,
  };
};

export default useMultiplayerGame;
