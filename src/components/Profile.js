import React, { useEffect, useState } from 'react';

const API_URL = 'https://telegram-city-rater-backend.onrender.com';

const VOTE_LABELS = {
  liked: '❤️ Лайк',
  disliked: '👎 Дизлайк',
  dont_know: '🤷‍♂️ Не был(а)',
};

const VOTE_EMOJIS = {
  liked: '❤️',
  disliked: '👎',
  dont_know: '🤷‍♂️',
};

const SCROLL_THRESHOLD = 0.1; // 10%

function Profile({ userId }) {
  const [cities, setCities] = useState([]); // all cities with votes merged
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changing, setChanging] = useState({}); // cityId: true/false
  const [copied, setCopied] = useState(false);
  const [showVisitedOnly, setShowVisitedOnly] = useState(false);
  const [showUnvisitedOnly, setShowUnvisitedOnly] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hideVisited, setHideVisited] = useState(false);
  const [hideVisitedCountries, setHideVisitedCountries] = useState(false);
  const [countrySorts, setCountrySorts] = useState({}); // { [country]: { column: 'name'|'rating'|'vote', direction: 'asc'|'desc' } }

  // Fetch all cities and user votes, then merge
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API_URL}/api/all-cities`).then(res => res.json()),
      fetch(`${API_URL}/api/user-votes/${userId}`).then(res => res.json()),
      fetch(`${API_URL}/api/rankings`).then(res => res.json()),
    ])
      .then(([citiesData, votesData, ratingsData]) => {
        const userVotes = (votesData.userVotes || []);
        const ratingsMap = {};
        (ratingsData || []).forEach(r => { ratingsMap[r.cityId] = r; });
        // Merge user votes into cities
        const votesMap = {};
        userVotes.forEach(v => { votesMap[v.cityId] = v; });
        const merged = (citiesData.cities || []).map(city => {
          const vote = votesMap[city.cityId];
          const rating = ratingsMap[city.cityId];
          return {
            ...city,
            voteType: vote ? vote.voteType : undefined,
            rating: rating ? rating.rating : null,
            likes: rating ? rating.likes : 0,
            dislikes: rating ? rating.dislikes : 0,
            dont_know: rating ? rating.dont_know : 0,
          };
        });
        setCities(merged);
        setLoading(false);
      })
      .catch(() => {
        setError('Не удалось загрузить данные');
        setLoading(false);
      });
  }, [userId]);

  // Voting handler
  const handleChangeVote = (cityId, newVote) => {
    setChanging(ch => ({ ...ch, [cityId]: true }));
    fetch(`${API_URL}/api/change-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cityId, voteType: newVote })
    })
      .then(res => res.json())
      .then(() => {
        setCities(cities => cities.map(c => c.cityId === cityId ? { ...c, voteType: newVote } : c));
        setChanging(ch => ({ ...ch, [cityId]: false }));
      })
      .catch(() => {
        setError('Не удалось изменить голос');
        setChanging(ch => ({ ...ch, [cityId]: false }));
      });
  };

  // Copy user ID
  const copyUserId = () => {
    navigator.clipboard.writeText(userId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Group by country, sort cities A-Z
  const grouped = cities.reduce((acc, c) => {
    if (!acc[c.country]) acc[c.country] = [];
    acc[c.country].push(c);
    return acc;
  }, {});
  Object.keys(grouped).forEach(country => {
    grouped[country].sort((a, b) => a.name.localeCompare(b.name));
  });

  // Visited filter
  const visitedCountries = Object.keys(grouped).filter(country =>
    grouped[country].some(city => city.voteType === 'liked' || city.voteType === 'disliked')
  );
  const unvisitedCountries = Object.keys(grouped).filter(country =>
    grouped[country].every(city => city.voteType !== 'liked' && city.voteType !== 'disliked')
  );
  let filteredCountries = Object.keys(grouped);
  if (showVisitedOnly) {
    filteredCountries = visitedCountries;
  } else if (showUnvisitedOnly) {
    filteredCountries = unvisitedCountries;
  }

  // Statistics
  const visitedCities = cities.filter(c => c.voteType === 'liked' || c.voteType === 'disliked').length;
  const totalCities = cities.length;
  const totalCountries = Object.keys(grouped).length;

  // Scroll-to-top button logic
  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      setShowScrollTop(scrolled > SCROLL_THRESHOLD);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="profile-ui" style={{ padding: '2rem 1rem', maxWidth: 900, margin: '0 auto', position: 'relative' }}>
      <h2 style={{ marginBottom: '1rem' }}>Ваши голоса</h2>
      {/* UserID and Telegram Bot Link */}
      <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, marginBottom: '1rem', border: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>Ваш ID:</span>
          <code style={{ background: '#f5f5f5', padding: '0.3rem 0.5rem', borderRadius: 4, fontSize: '0.85rem', fontFamily: 'monospace' }}>{userId}</code>
          <button onClick={copyUserId} style={{ background: copied ? '#4caf50' : '#4f8cff', color: '#fff', border: 'none', borderRadius: 4, padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.8rem', transition: 'background 0.2s' }}>{copied ? '✓ Скопировано' : '📋 Копировать'}</button>
        </div>
        <div>
          <a href="https://t.me/rottentravelbot/" target="_blank" rel="noopener noreferrer" style={{ background: '#0088cc', color: '#fff', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>📱 Telegram Bot</a>
        </div>
      </div>
      {/* ID Explanation */}
      <div style={{ background: '#fffbf0', padding: '0.8rem', borderRadius: 6, marginBottom: '1.5rem', fontSize: '0.85rem', color: '#8b4513', border: '1px solid #ffeaa7' }}>💡 Ваш ID является вашим логином. Запомните его, например, переслав в Телеграм-бот.</div>
      {/* Disclaimer */}
      <div style={{ background: '#f0f8ff', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #e0e0e0' }}>
        <p style={{ margin: 0, marginBottom: '0.5rem' }}><strong>Что означают эмодзи:</strong></p>
        <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
          ❤️ <strong>Лайк</strong> — город понравился (засчитывается как посещение)
          <br />👎 <strong>Дизлайк</strong> — город не понравился (засчитывается как посещение)
          <br />🤷‍♂️ <strong>Не был(а)</strong> — не посещали этот город
        </p>
      </div>
      {/* Statistics and toggle */}
      {!loading && !error && cities.length > 0 && (
        <div style={{ background: '#f9f9fc', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f8cff' }}>{visitedCities}/{totalCities}</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>городов посещено</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f8cff' }}>{visitedCountries.length}/{totalCountries}</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>стран посещено</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.95rem' }}>
              <input
                type="checkbox"
                checked={showVisitedOnly}
                onChange={e => {
                  setShowVisitedOnly(e.target.checked);
                  if (e.target.checked) setShowUnvisitedOnly(false);
                }}
                style={{ marginRight: 4 }}
              />
              Оставить только посещенные страны
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.95rem' }}>
              <input
                type="checkbox"
                checked={showUnvisitedOnly}
                onChange={e => {
                  setShowUnvisitedOnly(e.target.checked);
                  if (e.target.checked) setShowVisitedOnly(false);
                }}
                style={{ marginRight: 4 }}
              />
              Убрать посещенные страны
            </label>
          </div>
        </div>
      )}
      {loading ? (
        <div className="placeholder">Загрузка данных...</div>
      ) : error ? (
        <div className="placeholder">{error}</div>
      ) : cities.length === 0 ? (
        <div className="placeholder">Нет данных о городах.</div>
      ) : (
        filteredCountries.sort().map(country => {
          const countryCities = grouped[country];
          // Calculate country overall rating and hidden-gem score using the same formula as in Ratings.js
          let totalLikes = 0, totalDislikes = 0, totalDontKnow = 0;
          countryCities.forEach(city => {
            totalLikes += city.likes || 0;
            totalDislikes += city.dislikes || 0;
            totalDontKnow += city.dont_know || 0;
          });
          const totalVotes = totalLikes + totalDislikes;
          const totalResponses = totalLikes + totalDislikes + totalDontKnow;
          const countryRating = totalVotes > 0 ? totalLikes / totalVotes : null;
          const popularity = totalResponses > 0 ? (totalVotes / totalResponses) : 0;
          const hiddenJamScore = totalResponses > 0 ? (countryRating || 0) * (1 - popularity) : null;
          // Sorting logic
          const sort = countrySorts[country] || { column: 'name', direction: 'asc' };
          const sortedCities = [...countryCities].sort((a, b) => {
            if (sort.column === 'name') {
              return sort.direction === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
            } else if (sort.column === 'rating') {
              // Nulls last
              const aRating = a.rating === null ? -Infinity : a.rating;
              const bRating = b.rating === null ? -Infinity : b.rating;
              return sort.direction === 'asc' ? aRating - bRating : bRating - aRating;
            } else if (sort.column === 'vote') {
              // Order: liked > disliked > dont_know > undefined
              const voteOrder = v => v === 'liked' ? 3 : v === 'disliked' ? 2 : v === 'dont_know' ? 1 : 0;
              return sort.direction === 'asc'
                ? voteOrder(a.voteType) - voteOrder(b.voteType)
                : voteOrder(b.voteType) - voteOrder(a.voteType);
            }
            return 0;
          });
          // Sort icon helpers
          const getSortIcon = (col) => {
            if (sort.column !== col) return null;
            if (col === 'name') return sort.direction === 'asc' ? '▲' : '▼';
            if (col === 'rating') return sort.direction === 'asc' ? '▲' : '▼';
            if (col === 'vote') return sort.direction === 'asc' ? '▲' : '▼';
            return null;
          };
          const handleSort = (col) => {
            setCountrySorts(sorts => {
              const prev = sorts[country] || { column: 'name', direction: 'asc' };
              if (prev.column === col) {
                return { ...sorts, [country]: { column: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' } };
              } else {
                return { ...sorts, [country]: { column: col, direction: 'asc' } };
              }
            });
          };
          const anyVisited = countryCities.some(city => city.voteType === 'liked' || city.voteType === 'disliked');
          const allDontKnow = countryCities.every(city => city.voteType === 'dont_know');
          const noVotes = countryCities.every(city => city.voteType === undefined);
          const handleBulkDontKnow = async () => {
            for (const city of countryCities) {
              if (city.voteType !== 'dont_know') {
                setChanging(ch => ({ ...ch, [city.cityId]: true }));
                await fetch(`${API_URL}/api/change-vote`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId, cityId: city.cityId, voteType: 'dont_know' })
                });
                setCities(cities => cities.map(c => c.cityId === city.cityId ? { ...c, voteType: 'dont_know' } : c));
                setChanging(ch => ({ ...ch, [city.cityId]: false }));
              }
            }
          };
          // Был button style
          const bylStyle = {
            background: anyVisited ? '#4caf50' : '#e0e0e0',
            color: anyVisited ? '#fff' : '#888',
            border: 'none',
            borderRadius: 8,
            padding: '0.4rem 1.2rem',
            fontWeight: 'bold',
            cursor: 'default',
            opacity: anyVisited ? 1 : 0.7
          };
          // Не был button style
          let nebylStyle = {
            background: '#e0e0e0',
            color: '#888',
            border: '1.5px solid #f44336',
            borderRadius: 8,
            padding: '0.4rem 1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            opacity: 1,
            transition: 'all 0.2s'
          };
          let nebylDisabled = false;
          if (allDontKnow) {
            nebylStyle = {
              ...nebylStyle,
              background: '#f44336',
              color: '#fff',
              border: '1.5px solid #f44336',
              cursor: 'not-allowed',
              opacity: 1
            };
            nebylDisabled = true;
          } else if (anyVisited) {
            nebylStyle = {
              ...nebylStyle,
              background: '#e0e0e0',
              color: '#888',
              border: '1.5px solid #e0e0e0',
              cursor: 'not-allowed',
              opacity: 0.7
            };
            nebylDisabled = true;
          } else if (noVotes) {
            nebylStyle = {
              ...nebylStyle,
              background: '#e0e0e0',
              color: '#888',
              border: '1.5px solid #f44336',
              cursor: 'pointer',
              opacity: 1
            };
            // Add hover effect
            nebylStyle['boxShadow'] = '0 0 0 2px #f4433633';
          }
          return (
            <div key={country} style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9fc', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.7rem' }}>
                <h3 style={{ margin: 0, flex: 1 }}>{countryCities[0].flag} {country}</h3>
                {countryRating !== null && (
                  <span style={{ fontSize: '2.1rem', fontWeight: 700, color: '#4f8cff', minWidth: 90, textAlign: 'right', display: 'inline-block' }}>
                    {Math.round(countryRating * 100)}%
                  </span>
                )}
              </div>
              {/* Был / Не был toggle */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <button
                  style={bylStyle}
                  disabled
                >
                  Был
                </button>
                <button
                  style={nebylStyle}
                  disabled={nebylDisabled}
                  onClick={nebylDisabled ? undefined : handleBulkDontKnow}
                >
                  Не был
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem', background: '#fff', borderRadius: 8, overflow: 'hidden', tableLayout: isMobile ? 'auto' : 'fixed' }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    <th style={{ textAlign: 'left', padding: 8, width: isMobile ? undefined : '50%', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>
                      {isMobile ? '🏙️' : 'Город'} <span style={{ fontSize: '0.9em' }}>{getSortIcon('name')}</span>
                    </th>
                    <th style={{ textAlign: 'left', padding: 8, width: isMobile ? undefined : '15%', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('rating')}>
                      {isMobile ? '📊' : 'Рейтинг'} <span style={{ fontSize: '0.9em' }}>{getSortIcon('rating')}</span>
                    </th>
                    <th style={{ textAlign: 'left', padding: 8, width: isMobile ? undefined : '15%', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('vote')}>
                      {isMobile ? '📝' : 'Оценка'} <span style={{ fontSize: '0.9em' }}>{getSortIcon('vote')}</span>
                    </th>
                    <th style={{ textAlign: 'left', padding: 8, width: isMobile ? undefined : '20%' }}>{isMobile ? '✏️' : 'Изменить'}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCities.map(city => (
                    <tr key={city.cityId} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 8, width: 'auto', minWidth: 0, maxWidth: isMobile ? undefined : '50%' }}>{city.name}</td>
                      <td style={{ padding: 8, width: '15%' }}>
                        {(city.rating !== null && ((city.likes || 0) + (city.dislikes || 0) >= 10))
                          ? Math.round(city.rating * 100) + '%'
                          : '⏳'}
                      </td>
                      <td style={{ padding: 8, fontSize: '1.2rem', width: '15%' }}>{VOTE_EMOJIS[city.voteType === 'liked' || city.voteType === 'disliked' || city.voteType === 'dont_know' ? city.voteType : null]}</td>
                      <td style={{ padding: 8, width: '20%', textAlign: 'left' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
                          {['liked', 'disliked', 'dont_know'].map(type => {
                            const hasVoted = city.voteType === 'liked' || city.voteType === 'disliked' || city.voteType === 'dont_know';
                            const isCurrent = hasVoted && city.voteType === type;
                            const isChanging = changing[city.cityId];
                            const baseStyle = {
                              marginRight: 2,
                              border: 'none',
                              borderRadius: 4,
                              padding: '0.1rem 0.3rem',
                              color: '#fff',
                              cursor: isChanging ? 'wait' : 'pointer',
                              fontWeight: 'normal',
                              opacity: 0.7,
                              background: '#bbb',
                              boxShadow: 'none',
                              transform: 'scale(1)',
                              transition: 'all 0.2s ease',
                              fontSize: '1.1rem',
                              minWidth: isMobile ? 24 : 28,
                              minHeight: isMobile ? 24 : 28,
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              lineHeight: 1.2
                            };
                            const votedStyle = hasVoted ? {
                              fontWeight: isCurrent ? 'bold' : 'normal',
                              opacity: isCurrent ? 1 : 0.6,
                              background: isCurrent
                                ? (type === 'liked' ? '#4caf50' : type === 'disliked' ? '#f44336' : '#bdbdbd')
                                : '#ddd',
                              boxShadow: isCurrent ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                              transform: isCurrent ? 'scale(1.05)' : 'scale(1)'
                            } : {};
                            const style = hasVoted ? { ...baseStyle, ...votedStyle } : baseStyle;
                            return (
                              <button
                                key={type}
                                disabled={isChanging}
                                onClick={() => handleChangeVote(city.cityId, type)}
                                style={style}
                              >
                                {VOTE_EMOJIS[type]}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
      {/* Scroll to top button */}
      {showScrollTop && (
        <button onClick={handleScrollTop} style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000, background: '#4f8cff', color: '#fff', border: 'none', borderRadius: '50%', width: 56, height: 56, fontSize: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s' }} title="Наверх">↑</button>
      )}
    </div>
  );
}

export default Profile; 