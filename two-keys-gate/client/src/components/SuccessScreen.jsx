import React from 'react';

const SuccessScreen = ({ message, onContinue }) => {

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
        {onContinue && (
          <button className="pixel-button large" onClick={onContinue}>
            Salir
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessScreen;
