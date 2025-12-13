import { useEffect, useState } from 'react'
import './styles/game.css'
import Minigame1 from './components/layout/Minigame1'
import Minigame2 from './components/layout/Minigame2'
import Minigame3 from './components/layout/Minigame3'
import Minigame4 from './components/layout/Minigame4'
import Minigame5 from './components/layout/Minigame5'
import Minigame6 from './components/layout/Minigame6'

function App() {
  const [currentMinigame, setCurrentMinigame] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const minigameId = urlParams.get('game');
    
    if (minigameId && minigameId >= 1 && minigameId <= 6) {
      setCurrentMinigame(parseInt(minigameId));
    }
  }, []);

  const renderMinigame = () => {
    switch (currentMinigame) {
      case 1:
        return <Minigame1 />;
      case 2:
        return <Minigame2 />;
      case 3:
        return <Minigame3 />;
      case 4:
        return <Minigame4 />;
      case 5:
        return <Minigame5 />;
      case 6:
        return <Minigame6 />;
      default:
        return (
          <div className="pixel-lobby">
            <div className="pixel-bg"></div>
            <div className="lobby-container">
              <h1 className="lobby-title">MINIGAMES</h1>
              <p className="lobby-subtitle">Select a minigame</p>
              <div className="lobby-section">
                <div className="rooms-list">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <div
                      key={num}
                      className="room-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setCurrentMinigame(num);
                        window.history.pushState({}, '', `?game=${num}`);
                      }}
                    >
                      <span className="room-code">MINIGAME {num}</span>
                      <span className="room-players">→</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="game-container">
      {renderMinigame()}
    </div>
  );
}

export default App;