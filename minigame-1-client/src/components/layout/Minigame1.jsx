import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/wordle.css';

const MAX_ATTEMPTS = 6;

const Minigame1 = () => {
  const [targetWord, setTargetWord] = useState('');
  const [wordLength, setWordLength] = useState(5); // Dinámico
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [message, setMessage] = useState('');
  const [gameStatus, setGameStatus] = useState('playing');
  const [shake, setShake] = useState(false);

  // Obtener palabra del servidor
  useEffect(() => {
    const fetchWord = async () => {
      try {
        const response = await fetch('http://localhost:1234/api/wordle/word');
        const data = await response.json();
        setTargetWord(data.word);
        setWordLength(data.word.length); // Establecer longitud dinámica
        console.log(`🎯 Word loaded: ${data.word.length} letters`);
      } catch (error) {
        console.error('Error:', error);
        setMessage('ERROR LOADING WORD');
      }
    };
    fetchWord();
  }, []);

  const handleKeyPress = useCallback((letter) => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length < wordLength) { // Usar wordLength dinámico
      setCurrentGuess(prev => prev + letter);
    }
  }, [gameStatus, currentGuess.length, wordLength]);

  const handleBackspace = useCallback(() => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [gameStatus]);

  const handleSubmit = useCallback(async () => {
    if (currentGuess.length !== wordLength || gameStatus !== 'playing') {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      // Verificar si la palabra existe
      const checkResponse = await fetch('http://localhost:1234/api/wordle/check-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: currentGuess })
      });

      const checkResult = await checkResponse.json();

      if (!checkResult.isValid) {
        setMessage('Palabra no válida');
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setMessage('');
        }, 1000);
        return;
      }

      // Validar contra palabra objetivo
      const validateResponse = await fetch('http://localhost:1234/api/wordle/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: currentGuess, word: targetWord })
      });

      const validation = await validateResponse.json();
      
      const newGuess = { 
        word: currentGuess.toUpperCase(), 
        evaluation: validation.evaluation,
        isCorrect: validation.isCorrect
      };

      // Actualizar localmente
      setGuesses(prev => [...prev, newGuess]);
      setCurrentRow(prev => prev + 1);
      setCurrentGuess('');
      setMessage('');

      // Verificar victoria o derrota
      if (validation.isCorrect) {
        setGameStatus('won');
        await fetch('http://localhost:1234/api/wordle/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: targetWord,
            attempts: guesses.length + 1,
            won: true,
            playerId: 'player1'
          })
        });
      } else if (guesses.length + 1 >= MAX_ATTEMPTS) {
        setGameStatus('lost');
        await fetch('http://localhost:1234/api/wordle/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: targetWord,
            attempts: MAX_ATTEMPTS,
            won: false,
            playerId: 'player1'
          })
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('ERROR');
      setTimeout(() => setMessage(''), 1500);
    }
  }, [currentGuess, targetWord, guesses, gameStatus, wordLength]);

  // Teclado físico
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStatus !== 'playing') return;

      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (/^[a-zA-ZñÑ]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, handleKeyPress, handleBackspace, handleSubmit]);

  const renderGrid = () => {
    const grid = [];
    
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const guess = guesses[i];
      const isCurrentRow = i === currentRow && gameStatus === 'playing';
      
      grid.push(
        <div key={i} className={`wordle-row ${shake && isCurrentRow ? 'shake' : ''}`}>
          {Array.from({ length: wordLength }).map((_, j) => { // Dinámico
            let letter = '';
            let state = '';
            
            if (guess) {
              letter = guess.word[j] || '';
              state = guess.evaluation[j] || '';
            } else if (isCurrentRow && currentGuess[j]) {
              letter = currentGuess[j];
              state = 'filled';
            }
            
            return (
              <div 
                key={j} 
                className={`wordle-cell ${state}`}
                style={{ animationDelay: guess ? `${j * 100}ms` : '0ms' }}
              >
                <span className="letter">{letter}</span>
              </div>
            );
          })}
        </div>
      );
    }
    
    return grid;
  };

  return (
    <div className="wordle-game">
      <div className="wordle-header">
        <h1 className="wordle-title">ADIVINA LA PALABRA</h1>
      </div>

      <div className="wordle-board">
        {renderGrid()}
      </div>

      <div className="wordle-footer">
        <p className="wordle-instruction">
          Escribe una palabra de {wordLength} letras<br/>
          Presiona ENTER para enviar
        </p>
      </div>

      {message && (
        <div className="wordle-toast">
          {message}
        </div>
      )}

      {gameStatus !== 'playing' && (
        <div className="wordle-overlay">
          <div className="wordle-result">
            <h2>{gameStatus === 'won' ? '¡GANASTE!' : 'PERDISTE'}</h2>
            <p>Palabra: {targetWord}</p>
            <p>Intentos: {guesses.length}/{MAX_ATTEMPTS}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Minigame1;