import React, { useState, useEffect } from 'react';
import '../../styles/game.css';

const Minigame1 = ({ gameData, onPlayerAction, myRole, mySessionId }) => {
  const [word, setWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (gameData.word) {
      setWord(gameData.word);
    }
  }, [gameData]);

  useEffect(() => {
    // Actualizar cuando alguien hace un guess
    if (gameData.wordUpdate) {
      setCurrentGuess(prev => {
        const chars = prev.split('');
        chars[gameData.wordUpdate.position] = gameData.wordUpdate.letter;
        return chars.join('');
      });
    }
  }, [gameData.wordUpdate]);

  const handleKeyPress = (letter) => {
    if (myRole === 'wordTyper' && currentGuess.length < 5) {
      const newGuess = currentGuess + letter;
      setCurrentGuess(newGuess);
      
      onPlayerAction({
        type: 'word_input',
        letter,
        position: currentGuess.length
      });
    }
  };

  const handleSubmit = async () => {
    if (currentGuess.length !== 5) return;

    // Verificar palabra con API
    const response = await fetch('http://localhost:3000/api/wordle/check-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: currentGuess })
    });

    const result = await response.json();

    if (!result.isValid) {
      setMessage('Invalid word!');
      return;
    }

    // Validar palabra
    const validationResponse = await fetch('http://localhost:3000/api/wordle/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess: currentGuess, word })
    });

    const validation = await validationResponse.json();
    
    setGuesses([...guesses, { word: currentGuess, evaluation: validation.evaluation }]);
    setCurrentGuess('');

    if (validation.isCorrect) {
      onPlayerAction({
        type: 'minigame_complete',
        success: true,
        score: 100
      });
    }
  };

  const renderKeyboard = () => {
    const rows = [
      'QWERTYUIOP'.split(''),
      'ASDFGHJKL'.split(''),
      'ZXCVBNM'.split('')
    ];

    return (
      <div className="wordle-keyboard">
        {rows.map((row, i) => (
          <div key={i} className="keyboard-row">
            {row.map(letter => (
              <button
                key={letter}
                className="key-button"
                onClick={() => handleKeyPress(letter)}
                disabled={myRole !== 'wordTyper'}
              >
                {letter}
              </button>
            ))}
          </div>
        ))}
        <button className="key-button submit" onClick={handleSubmit}>
          ENTER
        </button>
      </div>
    );
  };

  return (
    <div className="pixel-view">
      <div className="pixel-bg"></div>
      <div className="view-title">WORDLE</div>
      <div className="driver-container">
        <div className="wordle-container">
          <div className="role-indicator">
            You are: {myRole === 'wordSeer' ? 'WORD SEER' : 'WORD TYPER'}
          </div>

          {myRole === 'wordSeer' && (
            <div className="word-display">
              SECRET WORD: {word}
            </div>
          )}

          <div className="guesses-grid">
            {guesses.map((guess, i) => (
              <div key={i} className="guess-row">
                {guess.word.split('').map((letter, j) => (
                  <div key={j} className={`letter-box ${guess.evaluation[j]}`}>
                    {letter}
                  </div>
                ))}
              </div>
            ))}
            {currentGuess && (
              <div className="guess-row">
                {currentGuess.split('').map((letter, j) => (
                  <div key={j} className="letter-box current">
                    {letter}
                  </div>
                ))}
              </div>
            )}
          </div>

          {message && <div className="message">{message}</div>}

          {myRole === 'wordTyper' && renderKeyboard()}
          
          {myRole === 'wordSeer' && (
            <div className="instructions">
              Guide your partner verbally to type the word!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Minigame1;