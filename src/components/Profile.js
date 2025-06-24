import React, { useEffect, useState } from 'react';

const API_URL = 'https://telegram-city-rater-backend.onrender.com';

const VOTE_LABELS = {
  liked: '❤️ Лайк',
  disliked: '👎 Дизлайк',
  dont_know: '🤷‍♂️ Не знаю',
};

const VOTE_EMOJIS = {
  liked: '❤️',
  disliked: '👎',
  dont_know: '🤷‍♂️',
};

function Profile({ userId }) {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changing, setChanging] = useState({}); // cityId: true/false
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/user-votes/${userId}`)
      .then(res => res.json())
      .then(data => {
        setVotes(data.userVotes || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Не удалось загрузить ваши голоса');
        setLoading(false);
      });
  }, [userId]);

  const handleChangeVote = (cityId, newVote) => {
    setChanging(ch => ({ ...ch, [cityId]: true }));
    fetch(`${API_URL}/api/change-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cityId, voteType: newVote })
    })
      .then(res => res.json())
      .then(() => {
        setVotes(votes => votes.map(v => v.cityId === cityId ? { ...v, voteType: newVote } : v));
        setChanging(ch => ({ ...ch, [cityId]: false }));
      })
      .catch(() => {
        setError('Не удалось изменить голос');
        setChanging(ch => ({ ...ch, [cityId]: false }));
      });
  };

  const copyUserId = () => {
    navigator.clipboard.writeText(userId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Group votes by country
  const grouped = votes.reduce((acc, v) => {
    if (!acc[v.country]) acc[v.country] = [];
    acc[v.country].push(v);
    return acc;
  }, {});

  // Calculate statistics - we need to get total cities count from backend
  const visitedCities = votes.filter(v => v.voteType === 'liked' || v.voteType === 'disliked').length;
  const visitedCountries = Object.keys(grouped).filter(country => 
    grouped[country].some(city => city.voteType === 'liked' || city.voteType === 'disliked')
  ).length;
  const totalCities = votes.length;
  const totalCountries = Object.keys(grouped).length;

  return (
    <div className="profile-ui" style={{ padding: '2rem 1rem', maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Ваши голоса</h2>
      
      {/* UserID and Telegram Bot Link */}
      <div style={{ 
        background: '#fff', 
        padding: '1rem', 
        borderRadius: 8, 
        marginBottom: '1rem',
        border: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>Ваш ID:</span>
          <code style={{ 
            background: '#f5f5f5', 
            padding: '0.3rem 0.5rem', 
            borderRadius: 4, 
            fontSize: '0.85rem',
            fontFamily: 'monospace'
          }}>
            {userId}
          </code>
          <button
            onClick={copyUserId}
            style={{
              background: copied ? '#4caf50' : '#4f8cff',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '0.3rem 0.8rem',
              cursor: 'pointer',
              fontSize: '0.8rem',
              transition: 'background 0.2s'
            }}
          >
            {copied ? '✓ Скопировано' : '📋 Копировать'}
          </button>
        </div>
        <div>
          <a 
            href="https://t.me/rottentravelbot/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              background: '#0088cc',
              color: '#fff',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 6,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📱 Telegram Bot
          </a>
        </div>
      </div>

      {/* ID Explanation */}
      <div style={{ 
        background: '#fffbf0', 
        padding: '0.8rem', 
        borderRadius: 6, 
        marginBottom: '1.5rem',
        fontSize: '0.85rem',
        color: '#8b4513',
        border: '1px solid #ffeaa7'
      }}>
        💡 Ваш ID является вашим логином. Запомните его, например, переслав в Телеграм-бот.
      </div>
      
      {/* Disclaimer */}
      <div style={{ 
        background: '#f0f8ff', 
        padding: '1rem', 
        borderRadius: 8, 
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
        border: '1px solid #e0e0e0'
      }}>
        <p style={{ margin: 0, marginBottom: '0.5rem' }}>
          <strong>Что означают эмодзи:</strong>
        </p>
        <p style={{ margin: 0 }}>
          ❤️ <strong>Лайк</strong> — город понравился (засчитывается как посещение) • 
          👎 <strong>Дизлайк</strong> — город не понравился (засчитывается как посещение) • 
          🤷‍♂️ <strong>Не знаю</strong> — не посещали этот город
        </p>
      </div>

      {/* Statistics */}
      {!loading && !error && votes.length > 0 && (
        <div style={{ 
          background: '#f9f9fc', 
          padding: '1rem', 
          borderRadius: 8, 
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f8cff' }}>{visitedCities}/{totalCities}</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>городов посещено</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f8cff' }}>{visitedCountries}/{totalCountries}</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>стран посещено</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="placeholder">Загрузка ваших голосов...</div>
      ) : error ? (
        <div className="placeholder">{error}</div>
      ) : votes.length === 0 ? (
        <div className="placeholder">Вы ещё не проголосовали ни за один город.</div>
      ) : (
        Object.keys(grouped).sort().map(country => (
          <div key={country} style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9fc', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ marginBottom: '0.7rem' }}>{grouped[country][0].flag} {country}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem', background: '#fff', borderRadius: 8, overflow: 'hidden', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ textAlign: 'left', padding: 8, width: '40%' }}>Город</th>
                  <th style={{ textAlign: 'left', padding: 8, width: '20%' }}>Ваш голос</th>
                  <th style={{ textAlign: 'left', padding: 8, width: '40%' }}>Изменить голос</th>
                </tr>
              </thead>
              <tbody>
                {grouped[country].map(city => (
                  <tr key={city.cityId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 8, width: '40%' }}>{city.name}</td>
                    <td style={{ padding: 8, fontSize: '1.2rem', width: '20%' }}>{VOTE_EMOJIS[city.voteType]}</td>
                    <td style={{ padding: 8, width: '40%' }}>
                      {['liked', 'disliked', 'dont_know'].map(type => {
                        const isCurrent = city.voteType === type;
                        const isChanging = changing[city.cityId];
                        
                        return (
                          <button
                            key={type}
                            disabled={isCurrent || isChanging}
                            onClick={() => handleChangeVote(city.cityId, type)}
                            style={{
                              marginRight: 6,
                              border: 'none',
                              borderRadius: 6,
                              padding: '0.3rem 0.8rem',
                              color: '#fff',
                              cursor: isCurrent ? 'default' : (isChanging ? 'wait' : 'pointer'),
                              fontWeight: isCurrent ? 'bold' : 'normal',
                              opacity: isCurrent ? 1 : 0.6,
                              background: isCurrent 
                                ? (type === 'liked' ? '#4caf50' : type === 'disliked' ? '#f44336' : '#bdbdbd')
                                : '#ddd',
                              boxShadow: isCurrent ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                              transform: isCurrent ? 'scale(1.05)' : 'scale(1)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {VOTE_LABELS[type]}
                          </button>
                        );
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

export default Profile; 