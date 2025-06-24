import React, { useEffect, useState } from 'react';

const API_URL = 'https://telegram-city-rater-backend.onrender.com';

function Voting({ userId }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votedCount, setVotedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/cities?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setCities(data.cities || []);
        setVotedCount(data.votedCount || 0);
        setTotalCount(data.totalCount || 0);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load cities');
        setLoading(false);
      });
  }, [userId]);

  const handleVote = (voteType) => {
    if (!cities.length) return;
    setSubmitting(true);
    fetch(`${API_URL}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cityId: cities[0].cityId, voteType })
    })
      .then(res => res.json())
      .then(() => {
        setCities(cities.slice(1));
        setVotedCount(votedCount + 1);
        setSubmitting(false);
      })
      .catch(() => {
        setError('Failed to submit vote');
        setSubmitting(false);
      });
  };

  if (loading) return <div className="placeholder">Loading cities...</div>;
  if (error) return <div className="placeholder">{error}</div>;
  
  if (!cities.length) {
    return (
      <div className="placeholder" style={{ position: 'relative', overflow: 'hidden', height: '300px', background: '#f7f7f7' }}>
        <div style={{ marginBottom: '2rem', fontSize: '1.2rem', zIndex: 10, position: 'relative' }}>
          {votedCount}/{totalCount}! Вы проголосовали за все города!<br/>
          Не волнуйтесь, скоро мы добавим новые!
        </div>
        
        {/* 8-bit style game area */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: 0,
          right: 0,
          height: '100px',
          background: '#f0f0f0',
          borderTop: '2px solid #c0c0c0',
          overflow: 'hidden'
        }}>
          {/* Ground pattern */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'repeating-linear-gradient(to right, #888 0px, #888 10px, transparent 10px, transparent 20px)'
          }} />
          
          {/* T-Rex facing right */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            fontSize: '3rem',
            fontFamily: 'monospace',
            animation: 'runTRex 10s linear infinite',
            filter: 'contrast(1000%) brightness(0)',
            imageRendering: 'pixelated',
            transform: 'scaleX(-1)' // Flip to face right
          }}>
            🦖
          </div>
          
          {/* Pyramids of Giza */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            fontSize: '2.5rem',
            fontFamily: 'monospace',
            animation: 'moveLandmarks 10s linear infinite',
            filter: 'contrast(1000%) brightness(0)',
            imageRendering: 'pixelated'
          }}>
            ▲▲▲
          </div>
          
          {/* Eiffel Tower */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            fontSize: '2.5rem',
            fontFamily: 'monospace',
            animation: 'moveLandmarks 10s linear infinite',
            animationDelay: '-2.5s',
            filter: 'contrast(1000%) brightness(0)',
            imageRendering: 'pixelated'
          }}>
            🗼
          </div>
          
          {/* Moscow Kremlin Tower */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            fontSize: '2.5rem',
            fontFamily: 'monospace',
            animation: 'moveLandmarks 10s linear infinite',
            animationDelay: '-5s',
            filter: 'contrast(1000%) brightness(0)',
            imageRendering: 'pixelated'
          }}>
            🏰
          </div>
          
          {/* Statue of Liberty */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            fontSize: '2.5rem',
            fontFamily: 'monospace',
            animation: 'moveLandmarks 10s linear infinite',
            animationDelay: '-7.5s',
            filter: 'contrast(1000%) brightness(0)',
            imageRendering: 'pixelated'
          }}>
            🗽
          </div>
          
          {/* Simple clouds */}
          <div style={{
            position: 'absolute',
            top: '10px',
            fontSize: '1.5rem',
            animation: 'moveClouds 15s linear infinite',
            filter: 'contrast(1000%) brightness(0.7)'
          }}>
            ☁️
          </div>
          
          <div style={{
            position: 'absolute',
            top: '20px',
            fontSize: '1rem',
            animation: 'moveClouds 20s linear infinite',
            animationDelay: '-8s',
            filter: 'contrast(1000%) brightness(0.7)'
          }}>
            ☁️
          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes runTRex {
              0% { left: -80px; }
              100% { left: calc(100% + 80px); }
            }
            @keyframes moveLandmarks {
              0% { right: -150px; }
              100% { right: calc(100% + 150px); }
            }
            @keyframes moveClouds {
              0% { left: 100%; }
              100% { left: -100px; }
            }
          `
        }} />
      </div>
    );
  }

  const city = cities[0];

  return (
    <div className="voting-ui">
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{city.flag} {city.name}</div>
      <div style={{ color: '#888', marginBottom: 16 }}>{city.country}</div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button disabled={submitting} onClick={() => handleVote('disliked')} style={{ fontSize: '1.2rem', padding: '0.5rem 1.5rem', background: '#f44336', color: '#fff', border: 'none', borderRadius: 8 }}>👎 Дизлайк</button>
        <button disabled={submitting} onClick={() => handleVote('dont_know')} style={{ fontSize: '1.2rem', padding: '0.5rem 1.5rem', background: '#bdbdbd', color: '#fff', border: 'none', borderRadius: 8 }}>🤷‍♂️ Не знаю</button>
        <button disabled={submitting} onClick={() => handleVote('liked')} style={{ fontSize: '1.2rem', padding: '0.5rem 1.5rem', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 8 }}>❤️ Лайк</button>
      </div>
      <div style={{ color: '888' }}>Voted: {votedCount} / {totalCount}</div>
    </div>
  );
}

export default Voting;
