import React, { useEffect, useState } from 'react';

const API_URL = 'https://telegram-city-rater-backend.onrender.com';

function Ratings({ userId, compact }) {
  const [entity, setEntity] = useState('city'); // 'city' or 'country'
  const [mode, setMode] = useState('overall');
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hideUnpopular, setHideUnpopular] = useState(false);
  const [sortColumn, setSortColumn] = useState('#');
  const [sortDirection, setSortDirection] = useState('asc');
  const [allCities, setAllCities] = useState([]); // for country ratings

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (entity === 'city') {
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
    } else {
      // Fetch all cities and calculate country ratings
      Promise.all([
        fetch(`${API_URL}/api/all-cities`).then(res => res.json()),
        fetch(`${API_URL}/api/rankings`).then(res => res.json()),
        fetch(`${API_URL}/api/hidden-jam-ratings`).then(res => res.json()),
      ]).then(([citiesData, rankingsData, hiddenJamData]) => {
        const rankingsMap = {};
        (rankingsData || []).forEach(r => { rankingsMap[r.cityId] = r; });
        const hiddenJamMap = {};
        (hiddenJamData || []).forEach(r => { hiddenJamMap[r.cityId] = r; });
        const merged = (citiesData.cities || []).map(city => {
          const r = rankingsMap[city.cityId];
          const h = hiddenJamMap[city.cityId];
          return {
            ...city,
            rating: r ? r.rating : null,
            likes: r ? r.likes : 0,
            dislikes: r ? r.dislikes : 0,
            dont_know: r ? r.dont_know : 0,
            hiddenJamScore: h ? h.hiddenJamScore : null
          };
        });
        setAllCities(merged);
        // Calculate country ratings
        const grouped = {};
        merged.forEach(city => {
          if (!grouped[city.country]) grouped[city.country] = [];
          grouped[city.country].push(city);
        });
        const countryRatings = Object.keys(grouped).map(country => {
          const cities = grouped[country];
          let likes = 0, dislikes = 0, dont_know = 0;
          let ratingSum = 0, ratingCount = 0;
          let hiddenSum = 0, hiddenCount = 0;
          let flag = cities[0]?.flag || '';
          // Sum up all votes for the country
          cities.forEach(city => {
            likes += city.likes || 0;
            dislikes += city.dislikes || 0;
            dont_know += city.dont_know || 0;
          });
          // Only include cities with a rating in the average, but threshold is for the country
          if ((likes + dislikes) >= 10) {
            cities.forEach(city => {
              if (typeof city.rating === 'number') {
                ratingSum += city.rating;
                ratingCount++;
              }
              if (typeof city.hiddenJamScore === 'number') {
                hiddenSum += city.hiddenJamScore;
                hiddenCount++;
              }
            });
          }
          // Calculate country-level hiddenJamScore using the same formula as for cities
          const totalVotes = likes + dislikes;
          const totalResponses = likes + dislikes + dont_know;
          const rating = totalVotes > 0 ? (likes / totalVotes) : 0;
          const popularity = totalResponses > 0 ? (totalVotes / totalResponses) : 0;
          const hiddenJamScore = totalResponses > 0 ? rating * (1 - popularity) : null;
          return {
            country,
            flag,
            likes,
            dislikes,
            dont_know,
            rating: (likes + dislikes) > 0 ? likes / (likes + dislikes) : null,
            hiddenJamScore
          };
        });
        setRatings(countryRatings);
        setLoading(false);
      }).catch(() => {
        setError('Failed to load country ratings');
        setLoading(false);
      });
    }
  }, [mode, entity]);

  // When switching entity, set default sort for country
  useEffect(() => {
    if (entity === 'country') {
      setSortColumn('📊');
      setSortDirection('desc');
    } else if (entity === 'city') {
      setSortColumn('#');
      setSortDirection('asc');
    }
  }, [entity]);

  // Filter cities/countries based on the toggle
  const filteredRatings = hideUnpopular 
    ? ratings.filter(item => (item.likes || 0) + (item.dislikes || 0) >= 10)
    : ratings;

  // Sorting logic
  const getSortValue = (item, col) => {
    if (entity === 'city') {
      switch (col) {
        case '#': return ratings.indexOf(item);
        case 'Город': return item.name;
        case 'Страна': return item.country;
        case '📊': return mode === 'overall' ? item.rating : item.hiddenJamScore;
        case '❤️': return item.likes || 0;
        case '👎': return item.dislikes || 0;
        case '🤷‍♂️': return item.dont_know || 0;
        default: return '';
      }
    } else {
      switch (col) {
        case '#': return ratings.indexOf(item);
        case 'Страна': return item.country;
        case '📊': return mode === 'overall' ? item.rating : item.hiddenJamScore;
        case '❤️': return item.likes || 0;
        case '👎': return item.dislikes || 0;
        case '🤷‍♂️': return item.dont_know || 0;
        default: return '';
      }
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

  // Format numbers with k for thousands, max 3 chars (except 100k+)
  function formatVotes(num) {
    if (num == null) return '';
    if (num >= 100000) return Math.round(num / 1000) + 'k';
    if (num >= 10000) return Math.round(num / 1000) + 'k';
    if (num >= 1000) {
      let n = Math.round(num / 100) / 10;
      if (n >= 10) n = Math.round(n); // 10.0k -> 10k
      return n + 'k';
    }
    return num.toString();
  }

  return (
    <div className="ratings-ui">
      <div style={{ marginBottom: compact ? '0.2rem' : '0.5rem', display: 'flex', flexDirection: 'row', gap: compact ? 8 : 12, alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'flex-start', textAlign: 'left' }}>
        <button
          onClick={() => setEntity('city')}
          style={{
            fontWeight: entity === 'city' ? 'bold' : 'normal',
            marginRight: compact ? 4 : 8,
            border: 'none',
            borderRadius: 12,
            padding: compact ? '0.5rem 1.1rem' : '0.7rem 1.5rem',
            fontSize: compact ? '0.75rem' : '1rem',
            cursor: 'pointer',
            background: entity === 'city' ? '#4f8cff' : '#e0e0e0',
            color: entity === 'city' ? '#fff' : '#666',
            transition: 'all 0.2s ease',
            boxShadow: entity === 'city' ? '0 2px 8px rgba(79, 140, 255, 0.3)' : 'none'
          }}
        >
          Города
        </button>
        <button
          onClick={() => setEntity('country')}
          style={{
            fontWeight: entity === 'country' ? 'bold' : 'normal',
            marginRight: compact ? 8 : 16,
            border: 'none',
            borderRadius: 12,
            padding: compact ? '0.5rem 1.1rem' : '0.7rem 1.5rem',
            fontSize: compact ? '0.75rem' : '1rem',
            cursor: 'pointer',
            background: entity === 'country' ? '#4f8cff' : '#e0e0e0',
            color: entity === 'country' ? '#fff' : '#666',
            transition: 'all 0.2s ease',
            boxShadow: entity === 'country' ? '0 2px 8px rgba(79, 140, 255, 0.3)' : 'none'
          }}
        >
          Страны
        </button>
      </div>
      <div style={{ marginBottom: compact ? '0.7rem' : '1rem', display: 'flex', flexDirection: 'row', gap: compact ? 8 : 12, alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'flex-start', textAlign: 'left' }}>
        <button
          onClick={() => setMode('overall')}
          style={{
            fontWeight: mode === 'overall' ? 'bold' : 'normal',
            marginRight: compact ? 4 : 8,
            border: 'none',
            borderRadius: 12,
            padding: compact ? '0.5rem 1.1rem' : '0.7rem 1.5rem',
            fontSize: compact ? '0.75rem' : '1rem',
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
            marginRight: compact ? 8 : 16,
            border: 'none',
            borderRadius: 12,
            padding: compact ? '0.5rem 1.1rem' : '0.7rem 1.5rem',
            fontSize: compact ? '0.75rem' : '1rem',
            cursor: 'pointer',
            background: mode === 'hidden' ? '#4f8cff' : '#e0e0e0',
            color: mode === 'hidden' ? '#fff' : '#666',
            transition: 'all 0.2s ease',
            boxShadow: mode === 'hidden' ? '0 2px 8px rgba(79, 140, 255, 0.3)' : 'none'
          }}
        >
          Хидден-джемовость
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: compact ? '0.72rem' : '0.9rem' }}>
          <input
            type="checkbox"
            checked={hideUnpopular}
            onChange={(e) => setHideUnpopular(e.target.checked)}
          />
          Скрыть {entity === 'city' ? 'города' : 'страны'} с менее чем 10 голосами
        </label>
      </div>
      {loading ? (
        <div className="placeholder">Loading ratings...</div>
      ) : error ? (
        <div className="placeholder">{error}</div>
      ) : (
        <div style={{ maxHeight: 600, overflowY: 'auto', width: '100%' }}>
          <table className="ratings-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              {entity === 'city' ? (
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ textAlign: 'center', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === '#' ? '#e0eaff' : undefined }} onClick={() => handleSort('#')}>
                    # {sortColumn === '#' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === 'Город' ? '#e0eaff' : undefined }} onClick={() => handleSort('Город')}>
                    Город {sortColumn === 'Город' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === 'Страна' ? '#e0eaff' : undefined }} onClick={() => handleSort('Страна')}>
                    Страна {sortColumn === 'Страна' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === '📊' ? '#e0eaff' : undefined }} onClick={() => handleSort('📊')}>
                    📊 {sortColumn === '📊' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === '❤️' ? '#e0eaff' : undefined }} onClick={() => handleSort('❤️')}>
                    ❤️ {sortColumn === '❤️' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === '👎' ? '#e0eaff' : undefined }} onClick={() => handleSort('👎')}>
                    👎 {sortColumn === '👎' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === '🤷‍♂️' ? '#e0eaff' : undefined }} onClick={() => handleSort('🤷‍♂️')}>
                    🤷‍♂️ {sortColumn === '🤷‍♂️' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                </tr>
              ) : (
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ textAlign: 'center', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === '#' ? '#e0eaff' : undefined }} onClick={() => handleSort('#')}>
                    # {sortColumn === '#' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === 'Страна' ? '#e0eaff' : undefined }} onClick={() => handleSort('Страна')}>
                    Страна {sortColumn === 'Страна' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === '📊' ? '#e0eaff' : undefined }} onClick={() => handleSort('📊')}>
                    📊 {sortColumn === '📊' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === '❤️' ? '#e0eaff' : undefined }} onClick={() => handleSort('❤️')}>
                    ❤️ {sortColumn === '❤️' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === '👎' ? '#e0eaff' : undefined }} onClick={() => handleSort('👎')}>
                    👎 {sortColumn === '👎' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ textAlign: 'left', padding: 4, cursor: 'pointer', userSelect: 'none', background: sortColumn === '🤷‍♂️' ? '#e0eaff' : undefined }} onClick={() => handleSort('🤷‍♂️')}>
                    🤷‍♂️ {sortColumn === '🤷‍♂️' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                </tr>
              )}
            </thead>
            <tbody>
              {sortedRatings.map((item, idx) => (
                <tr key={entity === 'city' ? item.cityId : item.country} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 4, textAlign: 'center' }}>{idx + 1}</td>
                  {entity === 'city' ? (
                    <>
                      <td style={{ padding: 4 }}>{item.flag} {item.name}</td>
                      <td style={{ padding: 4 }}>{item.country}</td>
                    </>
                  ) : (
                    <td style={{ padding: 4 }}>{item.flag} {item.country}</td>
                  )}
                  <td style={{ padding: 4 }}>
                    {mode === 'overall'
                      ? (item.rating !== null ? (item.rating * 100).toFixed(1) + '%' : '—')
                      : (item.hiddenJamScore !== null ? (item.hiddenJamScore * 100).toFixed(1) + '%' : '—')}
                  </td>
                  <td style={{ padding: 4, fontSize: '0.8em' }}>{formatVotes(item.likes)}</td>
                  <td style={{ padding: 4, fontSize: '0.8em' }}>{formatVotes(item.dislikes)}</td>
                  <td style={{ padding: 4, fontSize: '0.8em' }}>{formatVotes(item.dont_know)}</td>
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
