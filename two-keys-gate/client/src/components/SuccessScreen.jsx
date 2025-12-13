import React, { useEffect } from 'react';

const SuccessScreen = ({ message, onContinue }) => {
  useEffect(() => {
    // Auto-continue after 5 seconds
    const timer = setTimeout(() => {
      onContinue();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="pixel-view">
      <div className="success-container">
        {/* Success Animation */}
        <div className="success-animation">
          <div className="door-opening">
            <div className="door-left"></div>
            <div className="door-right"></div>
          </div>
          <div className="success-particles"></div>
        </div>

        {/* Success Message */}
        <h1 className="success-title">¡ÉXITO!</h1>
        <p className="success-message">{message}</p>

        {/* Star Rating */}
        <div className="success-stars">
          <span className="star">⭐</span>
          <span className="star">⭐</span>
          <span className="star">⭐</span>
        </div>

        {/* Continue Button */}
        <button className="pixel-button large" onClick={onContinue}>
          Volver al Tablero
        </button>

        <p className="auto-continue-hint">
          Regresando automáticamente en 5 segundos...
        </p>
      </div>
    </div>
  );
};

export default SuccessScreen;
