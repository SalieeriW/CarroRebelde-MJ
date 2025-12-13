import React, { useRef, useEffect } from 'react';
import '../../styles/game.css';

const Minigame2 = ({ gameData, onGameUpdate }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    renderGame(ctx, canvas.width, canvas.height);
  }, [gameData]);

  const renderGame = (ctx, width, height) => {
    ctx.fillStyle = '#0f0f1e';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#00d9ff';
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('MINIGAME 2', width / 2, height / 2 - 40);
    
    ctx.fillStyle = '#00ff41';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText('Coming Soon...', width / 2, height / 2 + 20);
  };

  return (
    <div className="pixel-view">
      <div className="pixel-bg"></div>
      <div className="view-title">MINIGAME 2</div>
      <div className="driver-container">
        <canvas ref={canvasRef} className="driver-canvas" />
      </div>
    </div>
  );
};

export default Minigame2;

