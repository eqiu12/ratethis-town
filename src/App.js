import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Voting from './components/Voting';
import Ratings from './components/Ratings';
import Profile from './components/Profile';

function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');
  const [tab, setTab] = useState('ratings'); // Start with ratings when not logged in
  const [tabKey, setTabKey] = useState(0); // For forcing remount

  const handleLogin = (id) => {
    setUserId(id);
    localStorage.setItem('userId', id);
    setTab('voting'); // Switch to voting after login
    setTabKey(k => k + 1);
  };

  const handleLogout = () => {
    setUserId('');
    localStorage.removeItem('userId');
    setTab('ratings'); // Go back to ratings after logout
    setTabKey(k => k + 1);
  };

  // When switching tabs, increment tabKey to force remount
  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setTabKey(k => k + 1);
  };

  return (
    <div className="app-container">
      {/* Header with logout button (only when logged in) */}
      {userId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
          <button
            onClick={handleLogout}
            style={{
              background: '#eee',
              border: 'none',
              borderRadius: 6,
              padding: '0.5rem 1.2rem',
              cursor: 'pointer'
            }}
          >
            Выйти
          </button>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="nav-tabs" style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
        {userId && (
          <button
            onClick={() => handleTabSwitch('voting')}
            style={{ fontWeight: tab === 'voting' ? 'bold' : 'normal', border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', borderBottom: tab === 'voting' ? '2px solid #4f8cff' : '2px solid transparent', padding: '0.5rem 1.5rem' }}
          >
            Голосование
          </button>
        )}
        <button
          onClick={() => handleTabSwitch('ratings')}
          style={{ fontWeight: tab === 'ratings' ? 'bold' : 'normal', border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', borderBottom: tab === 'ratings' ? '2px solid #4f8cff' : '2px solid transparent', padding: '0.5rem 1.5rem' }}
        >
          Рейтинг
        </button>
        {userId && (
          <button
            onClick={() => handleTabSwitch('profile')}
            style={{ fontWeight: tab === 'profile' ? 'bold' : 'normal', border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', borderBottom: tab === 'profile' ? '2px solid #4f8cff' : '2px solid transparent', padding: '0.5rem 1.5rem' }}
          >
            Профиль
          </button>
        )}
      </div>

      {/* Main content */}
      {tab === 'voting' && userId && (
        <div className="main-layout">
          <div className="voting-area">
            <Voting key={`voting-${userId}-${tabKey}`} userId={userId} />
          </div>
          <div className="ratings-area">
            <Ratings userId={userId} compact={true} />
          </div>
        </div>
      )}
      {tab === 'ratings' && (
        <div className="main-layout">
          <div className="ratings-area" style={{ width: '100%' }}>
            <Ratings userId={userId} />
          </div>
        </div>
      )}
      {tab === 'profile' && userId && (
        <div className="main-layout">
          <div className="profile-area" style={{ width: '100%' }}>
            <Profile key={`profile-${userId}-${tabKey}`} userId={userId} />
          </div>
        </div>
      )}

      {/* Login overlay when not logged in */}
      {!userId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: 12,
            maxWidth: 500,
            margin: '1rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Вход в систему</h2>
            <div style={{ 
              background: '#f0f8ff', 
              padding: '1rem', 
              borderRadius: 8, 
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              lineHeight: '1.4'
            }}>
              <p style={{ margin: 0, marginBottom: '0.5rem' }}>
                Вы можете получить логин в телеграм-боте по адресу{' '}
                <a 
                  href="https://t.me/rottentravelbot/app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#0088cc', textDecoration: 'none' }}
                >
                  @rottentravelbot
                </a>.
              </p>
              <p style={{ margin: 0 }}>
                После старта мини-аппа вы сможете найти логин во вкладке «Профиль». 
                Вставьте его сюда. Дополнительной авторизации не потребуется.
              </p>
            </div>
            <Login onLogin={handleLogin} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
