import React, { useState } from 'react';
import '../../styles/game.css';

const Lobby = ({ onCreateRoom, onJoinRoom, rooms = [], players = [] }) => {
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = () => {
    if (onCreateRoom) {
      onCreateRoom();
    }
  };

  const handleJoinRoom = () => {
    if (roomCode.trim() && onJoinRoom) {
      onJoinRoom(roomCode.trim().toUpperCase());
    }
  };

  return (
    <div className="pixel-lobby">
      <div className="pixel-bg"></div>
      <div className="lobby-container">
        <h1 className="lobby-title">COCHE REBELDE 3D</h1>
        <p className="lobby-subtitle">Multiplayer Racing Game</p>

        {/* Create Room Section */}
        <div className="lobby-section">
          <button className="pixel-button large" onClick={handleCreateRoom}>
            Create New Room
          </button>
        </div>

        {/* Join Room Section */}
        <div className="lobby-section">
          <div className="section-header">Join Room</div>
          <div className="code-input-group">
            <input
              type="text"
              className="pixel-input"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button
              className="pixel-button"
              onClick={handleJoinRoom}
              disabled={!roomCode.trim()}
            >
              Join
            </button>
          </div>
        </div>

        {/* Available Rooms Section */}
        {rooms && rooms.length > 0 && (
          <div className="lobby-section">
            <div className="section-header">Available Rooms</div>
            <div className="rooms-list">
              {rooms.map((room, index) => (
                <div key={index} className="room-item">
                  <span className="room-code">{room.code}</span>
                  <span className="room-players">
                    {room.players || 0}/4 Players
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!rooms || rooms.length === 0) && (
          <div className="lobby-section">
            <div className="section-header">Available Rooms</div>
            <div className="no-rooms">No rooms available</div>
          </div>
        )}

        {/* Players in Room Section */}
        {players && players.length > 0 && (
          <div className="lobby-section">
            <div className="section-header">Players in Room</div>
            <div className="players-list">
              {players.map((player, index) => (
                <div key={index} className="player-item">
                  <div>
                    <div className="player-role">{player.role || 'Player'}</div>
                    <div>{player.name || `Player ${index + 1}`}</div>
                  </div>
                  <div className="player-status">
                    {player.ready ? 'READY' : 'WAITING'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;

