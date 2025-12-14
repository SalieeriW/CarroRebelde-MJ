import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_ROOM = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ROOM_CODE) || 'GOMOKU1';

const buildApiUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:3002`;
  }
  return 'http://localhost:3002';
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
    const stored = typeof window !== 'undefined' ? localStorage.getItem('gomoku-client-id') : null;
    const id = stored || generateId();
    if (typeof window !== 'undefined') {
      localStorage.setItem('gomoku-client-id', id);
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f4742f3a-4307-4e14-a3d4-5fb2145a2fd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/useMultiplayerGame.js:54',message:'State updated from poll',data:{turn:data.gomoku?.turn,disabled:data.gomoku?.turn === 'ai' || data.gomoku?.winner !== null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
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
      // #region agent log
      if (path === '/move' || path === '') {
        fetch('http://127.0.0.1:7242/ingest/f4742f3a-4307-4e14-a3d4-5fb2145a2fd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/useMultiplayerGame.js:86',message:'State updated from POST',data:{path,turn:data.gomoku?.turn,disabled:data.gomoku?.turn === 'ai' || data.gomoku?.winner !== null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      }
      // #endregion
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

  const claimRole = (role) => post('/claim', { role });
  const releaseRole = (role) => post('/release', { role });
  const setReady = (ready = true) => post('/ready', { ready });
  const setPlayerColor = (color) => post('/color', { color });
  const startCountdown = () => post('/start');
  const makeMove = (x, y) => post('/move', { x, y });
  const resetGame = () => post('/reset');
  const sendChat = (text) => post('/chat', { text });

  const leaveRoom = () => {
    post('/release').catch(() => {});
    setConnected(false);
    setMyRole(null);
  };

  return {
    state,
    error,
    connected,
    myRole,
    sessionCode: state?.sessionCode || roomCode,
    claimRole,
    releaseRole,
    setReady,
    setPlayerColor,
    startCountdown,
    makeMove,
    resetGame,
    sendChat,
    leaveRoom,
  };
};

export default useMultiplayerGame;
