import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function ArticleTrendsBySport({ credentials, onLogout }) {
  const [chartData, setChartData] = useState(null);
  const [topSports, setTopSports] = useState([]);
  const [availableSports, setAvailableSports] = useState([]);
  const [articlesMap, setArticlesMap] = useState({});
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedYear, setSelectedYear] = useState(null);
  const [viewMode, setViewMode] = useState('top'); 
  const [error, setError] = useState('');

  useEffect(() => {
    const headers = {
      'x-db-host': credentials.host,
      'x-db-database': credentials.database,
      'x-db-user': credentials.user,
      'x-db-password': credentials.password,
    };

    fetch('http://localhost:8000/articles/', { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error('database connection error');
        return res.json();
      })
      .then((json) => {
        const data = json.articles || [];

        const trendDataMap = {};
        const articlesByYearSport = {};
        const sportTotals = {};

        data.forEach(({ year, sport, ut, title }) => {
          if (!year || !sport || sport === 'None') return;

          const y = String(year).trim();
          const s = sport.trim();

          sportTotals[s] = (sportTotals[s] || 0) + 1;

          if (!trendDataMap[y]) trendDataMap[y] = {};
          trendDataMap[y][s] = (trendDataMap[y][s] || 0) + 1;

          if (!articlesByYearSport[y]) articlesByYearSport[y] = {};
          if (!articlesByYearSport[y][s]) articlesByYearSport[y][s] = [];
          articlesByYearSport[y][s].push({ ut, title });
        });

        const top5 = Object.entries(sportTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([s]) => s);

        const allYears = Object.keys(trendDataMap).sort((a, b) => a - b);
        const allSports = Array.from(new Set(Object.keys(sportTotals))).sort();

        const topFormatted = allYears.map((year) => {
          const row = { year };
          top5.forEach((sport) => {
            row[sport] = trendDataMap[year]?.[sport] || 0;
          });
          return row;
        });

        const customFormatted = allYears.map((year) => {
          const row = { year };
          allSports.forEach((sport) => {
            row[sport] = trendDataMap[year]?.[sport] || 0;
          });
          return row;
        });

        setTopSports(top5);
        setAvailableSports(allSports);
        setSelectedSport(allSports[0] || '');
        setChartData({ top: topFormatted, custom: customFormatted });
        setArticlesMap(articlesByYearSport);
      })
      .catch(() => setError('database connection error'));
  }, [credentials]);

  const handlePointClick = (data) => {
    if (!data || !data.activeLabel) return;

    const year = data.activeLabel;

    if (viewMode === 'custom' ) {
      setSelectedYear(year);
    } else {
      const clicked = data.activePayload.find((entry) =>
        topSports.includes(entry.dataKey)
      );
      if (clicked) {
        setSelectedYear(year);
        setSelectedSport(clicked.dataKey);
      }
    }
  };

  const selectedArticles =
    selectedYear && selectedSport && articlesMap[selectedYear]
      ? articlesMap[selectedYear][selectedSport] || []
      : [];

  const colors = ['#8884d8', '#82ca9d', '#ff7300', '#ff69b4', '#00bcd4', '#a83232', '#2c82c9', '#f4c542'];

  if (error) {
    return (
      <div className="bg-white p-6 rounded shadow-md text-center max-w-md">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button onClick={onLogout} className="bg-gray-700 text-white px-4 py-2 rounded">
          Try Again
        </button>
      </div>
    );
  }

  if (!chartData) {
    return <p>Loading sports trend data...</p>;
  }

  const activeData = viewMode === 'custom' ? chartData.custom : chartData.top;

  return (
    <div className="w-full max-w-6xl h-[600px] bg-white p-6 rounded shadow-md flex overflow-hidden">
      {/* Chart Section */}
      <div
        className="transition-all duration-500 ease-in-out"
        style={{
          flexGrow: selectedYear ? 1 : 'unset',
          width: selectedYear ? '70%' : '100%',
          minWidth: 0,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {viewMode === 'top' ? 'Top 5 Sports Trends' : 'Trends by Selected Sport'}
          </h2>
          <div className="flex space-x-4 items-center">
            <select
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value);
                setSelectedYear(null);
              }}
              className="border rounded px-3 py-1"
            >
              <option value="top">Top 5 Sports</option>
              <option value="custom">Custom Sport</option>
            </select>

            {viewMode === 'custom' && (
              <select
                value={selectedSport}
                onChange={(e) => {
                  setSelectedSport(e.target.value);
                  setSelectedYear(null);
                }}
                className="border rounded px-3 py-1"
              >
                {availableSports.map((sport) => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <ResponsiveContainer width="100%" height="90%">
          <LineChart
            data={activeData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            onClick={handlePointClick}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {viewMode === 'top'
              ? topSports.map((sport, i) => (
                  <Line
                    key={sport}
                    type="monotone"
                    dataKey={sport}
                    stroke={colors[i % colors.length]}
                    activeDot={{ r: 8 }}
                    cursor="pointer"
                  />
                ))
              : selectedSport && (
                  <Line
                    type="monotone"
                    dataKey={selectedSport}
                    stroke={colors[0]}
                    activeDot={{ r: 8 }}
                    cursor="pointer"
                  />
                )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sidebar */}
      {selectedYear && selectedSport && (
        <div className="w-[30%] bg-gray-50 border-l border-gray-300 p-6 overflow-y-auto">
          <button
            className="mb-4 text-gray-600 hover:text-gray-900"
            onClick={() => setSelectedYear(null)}
          >
            &larr; Close
          </button>
          <h3 className="text-xl font-semibold mb-2">
            Articles for {selectedSport} in {selectedYear}
          </h3>
          {selectedArticles.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 max-h-[480px] overflow-y-auto">
              {selectedArticles.map(({ ut, title }) => (
                <li key={ut} className="break-words">
                  <a
                    href={`https://www.webofscience.com/wos/woscc/full-record/${ut}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>No articles available for this sport and year.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ArticleTrendsBySport;
