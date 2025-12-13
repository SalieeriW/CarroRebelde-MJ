import { useEffect, useMemo, useRef, useState } from 'react';
import levelData from '../../../shared/levelData.json';

const CHANNEL_NAME = 'twokeys-local';
const STATE_KEY = 'twokeys-local-state';
const HOST_KEY = 'twokeys-local-host';

const createInitialState = () => ({
  sessionCode: 'LOCAL',
  levelId: 1,
  phase: 'lobby', // lobby, briefing, active, sync_confirm, success, retry
  playerA: {
    sessionId: '',
    selectedAnswer: [],
    confirmedAt: 0,
    isReady: false,
    role: 'A',
  },
  playerB: {
    sessionId: '',
    selectedAnswer: [],
    confirmedAt: 0,
    isReady: false,
    role: 'B',
  },
  moderatorId: '',
  hintCount: 0,
  createdAt: Date.now(),
  currentHint: '',
  resultMessage: '',
  resultSuccess: false,
  chatMessages: [],
  playersConnected: 0,
});

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

/**
 * useLocalGame
 * 本地双窗口模拟，不依赖服务器。
 * 打开两个标签页即可自动分配玩家 A / B，状态通过 BroadcastChannel 同步。
 */
const useLocalGame = () => {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const channelRef = useRef(null);
  const stateRef = useRef(null);
  const hostIdRef = useRef(null);
  const timeoutsRef = useRef([]);
  const joinRequestedRef = useRef(false);
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const envPreferredRole =
    typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_DEFAULT_ROLE?.toUpperCase()
      : undefined;
  const preferredRole = urlParams.get('player')?.toUpperCase() || envPreferredRole; // 'A' | 'B'
  const clientId = useMemo(() => generateId(), []);

  // Helpers
  const clearTimers = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const pushState = (nextState) => {
    stateRef.current = nextState;
    setState(nextState);
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(nextState));
    } catch (e) {
      console.warn('Persist state failed', e);
    }
    channelRef.current?.postMessage({ type: 'state', state: nextState, sender: clientId });
  };

  const ensureHost = () => {
    const storedHost = localStorage.getItem(HOST_KEY);
    if (!storedHost) {
      localStorage.setItem(HOST_KEY, clientId);
      hostIdRef.current = clientId;
    } else {
      hostIdRef.current = storedHost;
    }
  };

  const isHost = () => hostIdRef.current === clientId;
  const shouldHandleActions = () => {
    const storedHost = localStorage.getItem(HOST_KEY);
    // If no host, claim it
    if (!storedHost) {
      localStorage.setItem(HOST_KEY, clientId);
      hostIdRef.current = clientId;
    }
    return hostIdRef.current === clientId;
  };

  const assignRole = (draft, joinerId) => {
    // If URL param fixes role, honor it
    if (preferredRole === 'A' && !draft.playerA.sessionId) {
      draft.playerA.sessionId = joinerId;
    } else if (preferredRole === 'B' && !draft.playerB.sessionId) {
      draft.playerB.sessionId = joinerId;
    } else if (!draft.playerA.sessionId) {
      draft.playerA.sessionId = joinerId;
    } else if (!draft.playerB.sessionId) {
      draft.playerB.sessionId = joinerId;
    }
    draft.playersConnected =
      (draft.playerA.sessionId ? 1 : 0) + (draft.playerB.sessionId ? 1 : 0);
  };

  const resetConfirmations = (draft) => {
    draft.playerA.confirmedAt = 0;
    draft.playerB.confirmedAt = 0;
  };

  const checkAnswer = () => {
    const current = stateRef.current;
    if (!current) return;
    const level = levelData.levels[current.levelId - 1];
    const correct = level.correctAnswer;
    const a = current.playerA.selectedAnswer || [];
    const b = current.playerB.selectedAnswer || [];

    // 玩家答案必须一致
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      const draft = {
        ...current,
        phase: 'retry',
        resultSuccess: false,
        resultMessage: 'Parece que eligieron respuestas diferentes. Revisen juntos.',
      };
      resetConfirmations(draft);
      pushState(draft);
      const t = setTimeout(() => {
        const c = stateRef.current;
        if (c) pushState({ ...c, phase: 'active' });
      }, 3000);
      timeoutsRef.current.push(t);
      return;
    }

    // 答案正确
    if (JSON.stringify(a) === JSON.stringify(correct)) {
      const draft = {
        ...current,
        phase: 'success',
        resultSuccess: true,
        resultMessage: level.successMessage,
      };
      pushState(draft);
    } else {
      // 答案错误，提供提示
      const hintCount = current.hintCount + 1;
      let hint = level.hints.generic;
      if (hintCount === 2) hint = level.hints.specific;
      if (hintCount >= 3) hint = level.hints.stepByStep;

      const draft = {
        ...current,
        phase: 'retry',
        resultSuccess: false,
        hintCount,
        currentHint: hint,
        resultMessage: level.retryMessage,
      };
      resetConfirmations(draft);
      pushState(draft);
      const t = setTimeout(() => {
        const c = stateRef.current;
        if (c) pushState({ ...c, phase: 'active' });
      }, 3000);
      timeoutsRef.current.push(t);
    }
  };

  const handleAction = (action, payload, sender) => {
    const current = stateRef.current || createInitialState();
    let draft = { ...current };

    switch (action) {
      case 'join': {
        assignRole(draft, sender);
        // 两人到齐就直接进入 briefing -> active，免点击阻塞
        if (draft.playersConnected >= 2) {
          draft.playerA.isReady = true;
          draft.playerB.isReady = true;
          draft.phase = 'briefing';
          pushState(draft);
          const t = setTimeout(() => {
            const c = stateRef.current;
            if (c) pushState({ ...c, phase: 'active' });
          }, 500);
          timeoutsRef.current.push(t);
        } else {
          pushState(draft);
        }
        break;
      }
      case 'leave': {
        if (draft.playerA.sessionId === sender) {
          draft.playerA = { ...createInitialState().playerA };
        }
        if (draft.playerB.sessionId === sender) {
          draft.playerB = { ...createInitialState().playerB };
        }
        draft.playersConnected =
          (draft.playerA.sessionId ? 1 : 0) + (draft.playerB.sessionId ? 1 : 0);
        pushState(draft);
        break;
      }
      case 'player_ready': {
        const role = payload.role;
        const target = role === 'A' ? draft.playerA : draft.playerB;
        target.isReady = true;
        // 双方准备好 -> 进入 briefing，短暂后自动 active
        if (draft.playerA.isReady && draft.playerB.isReady) {
          draft.phase = 'briefing';
          pushState(draft);
          const t = setTimeout(() => {
            const c = stateRef.current;
            if (c) pushState({ ...c, phase: 'active' });
          }, 500);
          timeoutsRef.current.push(t);
        } else {
          pushState(draft);
        }
        break;
      }
      case 'start_game': {
        if (draft.phase === 'briefing') {
          draft.phase = 'active';
          pushState(draft);
        }
        break;
      }
      case 'select_answer': {
        const role = payload.role;
        const target = role === 'A' ? draft.playerA : draft.playerB;
        target.selectedAnswer = [...(payload.answer || [])];
        pushState(draft);
        break;
      }
      case 'confirm_answer': {
        const role = payload.role;
        const target = role === 'A' ? draft.playerA : draft.playerB;
        target.confirmedAt = Date.now();
        pushState(draft);

        if (draft.playerA.confirmedAt && draft.playerB.confirmedAt) {
          const diff = Math.abs(draft.playerA.confirmedAt - draft.playerB.confirmedAt);
          if (diff < 10000) {
            // 同步成功，播放动画后校验
            draft.phase = 'sync_confirm';
            pushState(draft);
            const t = setTimeout(() => checkAnswer(), 1500);
            timeoutsRef.current.push(t);
          } else {
            draft.phase = 'active';
            resetConfirmations(draft);
            pushState(draft);
          }
        }
        break;
      }
      case 'chat_message': {
        const role = payload.role;
        const text = (payload.text || '').slice(0, 100);
        const nextMessages = [...(draft.chatMessages || []), {
          role,
          text,
          timestamp: Date.now(),
        }].slice(-20);
        draft.chatMessages = nextMessages;
        pushState(draft);
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    ensureHost();

    // 初始化状态
    try {
      const cached = localStorage.getItem(STATE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        stateRef.current = parsed;
        setState(parsed);
      } else {
        const init = createInitialState();
        stateRef.current = init;
        setState(init);
      }
    } catch {
      const init = createInitialState();
      stateRef.current = init;
      setState(init);
    }

    // 消息监听
    channelRef.current.onmessage = (evt) => {
      const data = evt.data;
      if (data.type === 'state') {
        if (data.sender === clientId) return; // ignore own echo
        stateRef.current = data.state;
        setState(data.state);
      }
      if (data.type === 'action') {
        if (data.clientId === clientId) return; // ignore own echo
        if (!shouldHandleActions()) return;
        handleAction(data.action, data.payload, data.clientId);
      }
    };

    // 通知加入
    channelRef.current.postMessage({ type: 'action', action: 'join', clientId });

    const handleUnload = () => {
      channelRef.current?.postMessage({ type: 'action', action: 'leave', clientId });
      if (isHost()) {
        localStorage.removeItem(HOST_KEY);
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      handleUnload();
      clearTimers();
      channelRef.current?.close();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derive role & connected
  useEffect(() => {
    if (!state) return;
    setConnected(true);
    if (state.playerA.sessionId === clientId) {
      setMyRole('A');
    } else if (state.playerB.sessionId === clientId) {
      setMyRole('B');
    } else {
      // 未分配则尝试分配（只发一次）
      if (!joinRequestedRef.current) {
        joinRequestedRef.current = true;
        sendAction('join', {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, clientId]);

  // Send action helper (handle locally if host, always broadcast)
  const sendAction = (action, payload = {}) => {
    try {
      if (shouldHandleActions()) {
        handleAction(action, payload, clientId);
      }
      channelRef.current?.postMessage({
        type: 'action',
        action,
        payload,
        clientId,
      });
    } catch (e) {
      setError(e);
    }
  };

  const sendMessage = (type, payload = {}) => {
    sendAction(type, { ...payload, role: myRole });
  };

  const leaveRoom = () => {
    channelRef.current?.postMessage({ type: 'action', action: 'leave', clientId });
    if (isHost()) {
      localStorage.removeItem(HOST_KEY);
    }
    setConnected(false);
    setMyRole(null);
  };

  return {
    room: null,
    state,
    error,
    connected,
    myRole,
    sessionCode: state?.sessionCode || 'LOCAL',
    sendMessage,
    leaveRoom,
  };
};

export default useLocalGame;
