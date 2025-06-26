import React, { useEffect, useState } from 'react';

const API_URL = 'https://telegram-city-rater-backend.onrender.com';

function Ratings({ userId }) {
  const [mode, setMode] = useState('overall');
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hideUnpopular, setHideUnpopular] = useState(false);
  const [sortColumn, setSortColumn] = useState('#');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const endpoint = mode === 'overall' ? '/api/rankings' : '/api/hidden-jam-ratings';
    fetch(`${API_URL}${endpoint}`)
      .then(res => res.json())
      .then(data => {
        setRatings(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load ratings');
        setLoading(false);
      });
  }, [mode]);

  // Filter cities based on the toggle
  const filteredRatings = hideUnpopular 
    ? ratings.filter(city => (city.likes || 0) + (city.dislikes || 0) >= 10)
    : ratings;

  // Sorting logic
  const getSortValue = (city, col) => {
    switch (col) {
      case '#': return ratings.indexOf(city);
      case 'Город': return city.name;
      case 'Страна': return city.country;
      case '📊': return mode === 'overall' ? city.rating : city.hiddenJamScore;
      case '❤️': return city.likes || 0;
      case '👎': return city.dislikes || 0;
      case '🤷‍♂️': return city.dont_know || 0;
      default: return '';
    }
  };

  const sortedRatings = [...filteredRatings].sort((a, b) => {
    const valA = getSortValue(a, sortColumn);
    const valB = getSortValue(b, sortColumn);
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }
  });

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  return (
    <div className="ratings-ui">
      <div style={{ marginBottom: '1rem', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setMode('overall')}
          style={{ 
            fontWeight: mode === 'overall' ? 'bold' : 'normal', 
            marginRight: 8,
            border: 'none',
            borderRadius: 12,
            padding: '0.7rem 1.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            background: mode === 'overall' ? '#4f8cff' : '#e0e0e0',
            color: mode === 'overall' ? '#fff' : '#666',
            transition: 'all 0.2s ease',
            boxShadow: mode === 'overall' ? '0 2px 8px rgba(79, 140, 255, 0.3)' : 'none'
          }}
        >
          Общий рейтинг
        </button>
        <button
          onClick={() => setMode('hidden')}
          style={{ 
            fontWeight: mode === 'hidden' ? 'bold' : 'normal', 
            marginRight: 16,
            border: 'none',
            borderRadius: 12,
            padding: '0.7rem 1.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            background: mode === 'hidden' ? '#4f8cff' : '#e0e0e0',
            color: mode === 'hidden' ? '#fff' : '#666',
            transition: 'all 0.2s ease',
            boxShadow: mode === 'hidden' ? '0 2px 8px rgba(79, 140, 255, 0.3)' : 'none'
          }}
        >
          Хидден-джемовость
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={hideUnpopular}
            onChange={(e) => setHideUnpopular(e.target.checked)}
          />
          Скрыть города с менее чем 10 голосами
        </label>
      </div>
      {loading ? (
        <div className="placeholder">Loading ratings...</div>
      ) : error ? (
        <div className="placeholder">{error}</div>
      ) : (
        <div style={{ maxHeight: 600, overflowY: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                {['#', 'Город', 'Страна', '📊', '❤️', '👎', '🤷‍♂️'].map(col => (
                  <th
                    key={col}
                    style={{ textAlign: 'left', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === col ? '#e0eaff' : undefined }}
                    onClick={() => handleSort(col)}
                  >
                    {col} {sortColumn === col ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRatings.map((city, idx) => (
                <tr key={city.cityId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 4 }}>{idx + 1}</td>
                  <td style={{ padding: 4 }}>{city.flag} {city.name}</td>
                  <td style={{ padding: 4 }}>{city.country}</td>
                  <td style={{ padding: 4 }}>
                    {mode === 'overall'
                      ? (city.rating * 100).toFixed(1) + '%'
                      : (city.hiddenJamScore * 100).toFixed(1) + '%'}
                  </td>
                  <td style={{ padding: 4 }}>{city.likes || 0}</td>
                  <td style={{ padding: 4 }}>{city.dislikes || 0}</td>
                  <td style={{ padding: 4 }}>{city.dont_know || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Ratings;
