import { useEffect, useState } from 'react';
import useColyseus from './useColyseus';

/**
 * Multiplayer adapter that mirrors useLocalGame's shape but connects to Colyseus.
 * It auto joinOrCreate the `two_keys` room when enabled.
 */
const useMultiplayerGame = (serverUrl, enabled = true, roomName = 'two_keys') => {
  const [autoJoinError, setAutoJoinError] = useState(null);

  const {
    room,
    state,
    error,
    connected,
    myRole,
    sessionCode,
    joinOrCreateRoom,
    sendMessage: rawSendMessage,
    leaveRoom,
  } = useColyseus(serverUrl, roomName);

  useEffect(() => {
    if (!enabled) return undefined;

    joinOrCreateRoom().catch((e) => {
      console.error('Auto join failed:', e);
      setAutoJoinError(e);
    });

    return () => {
      leaveRoom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const sendMessage = (type, payload = {}) => {
    if (!enabled || !room) return;
    rawSendMessage(type, { ...payload, role: payload.role || myRole });
  };

  return {
    room: enabled ? room : null,
    state: enabled ? state : null,
    error: enabled ? autoJoinError || error : null,
    connected: enabled ? connected : false,
    myRole: enabled ? myRole : null,
    sessionCode: enabled ? sessionCode : null,
    sendMessage,
    leaveRoom: enabled ? leaveRoom : () => {},
  };
};

export default useMultiplayerGame;
