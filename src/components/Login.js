import React, { useState } from 'react';

const API_URL = 'https://telegram-city-rater-backend.onrender.com';

function Login({ onLogin }) {
  const [input, setInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = input.trim();
    
    if (!userId) {
      setError('Пожалуйста, введите User ID');
      return;
    }

    setValidating(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/validate-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.valid) {
        onLogin(userId);
      } else {
        setError(data.error || 'Неверный User ID');
      }
    } catch (err) {
      setError('Ошибка проверки User ID. Попробуйте позже.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <form className="login-placeholder" onSubmit={handleSubmit}>
      <h2>Вход</h2>
      <input
        type="text"
        placeholder="Введите User ID"
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={validating}
        style={{
          width: '100%',
          padding: '0.5rem',
          marginBottom: '0.5rem',
          border: error ? '1px solid #f44336' : '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '1rem'
        }}
      />
      {error && (
        <div style={{
          color: '#f44336',
          fontSize: '0.9rem',
          marginBottom: '0.5rem',
          textAlign: 'left'
        }}>
          {error}
        </div>
      )}
      <button 
        type="submit" 
        disabled={validating}
        style={{
          width: '100%',
          padding: '0.5rem 1rem',
          background: validating ? '#ccc' : '#4f8cff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '1rem',
          cursor: validating ? 'not-allowed' : 'pointer'
        }}
      >
        {validating ? 'Проверка...' : 'Войти'}
      </button>
    </form>
  );
}

export default Login;
