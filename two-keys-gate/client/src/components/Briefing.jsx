import React, { useState, useEffect } from 'react';
import levelData from '../../../shared/levelData.json';

const Briefing = ({ onStart, onExit }) => {
  const [countdown, setCountdown] = useState(30);
  const briefing = levelData.briefing;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onStart]);

  return (
    <div className="pixel-view">
      <div className="briefing-container">
        {/* Exit Button */}
        <button className="exit-button-top" onClick={onExit}>
          ← Volver
        </button>

        {/* Title */}
        <h1 className="briefing-title">{briefing.title}</h1>
        <p className="briefing-description">{briefing.description}</p>

        {/* Instructions */}
        <div className="briefing-section">
          <div className="section-header">Cómo Jugar</div>
          <div className="instructions-list">
            {briefing.instructions.map((instruction, index) => (
              <div key={index} className="instruction-item">
                {instruction}
              </div>
            ))}
          </div>
        </div>

        {/* Reminder */}
        <div className="briefing-reminder">
          {briefing.reminder}
        </div>

        {/* Countdown */}
        <div className="briefing-countdown">
          El juego comenzará en {countdown} segundos...
        </div>

        {/* Manual Start */}
        <button className="pixel-button large" onClick={onStart}>
          {briefing.startButton}
        </button>
      </div>
    </div>
  );
};

export default Briefing;
