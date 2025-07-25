import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function ArticleTrendsBySport({ credentials, onLogout }) {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState('');
  const [availableSports, setAvailableSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState('');
  const [articlesMap, setArticlesMap] = useState({});
  const [selectedYear, setSelectedYear] = useState(null);

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

        data.forEach(({ year, sport, ut, title }) => {
          if (!year || !sport || sport === 'None') return;

          const yearStr = String(year).trim();
          const sportStr = sport.trim();

          // Count for chart
          if (!trendDataMap[yearStr]) trendDataMap[yearStr] = {};
          trendDataMap[yearStr][sportStr] = (trendDataMap[yearStr][sportStr] || 0) + 1;

          // Group articles by year and sport
          if (!articlesByYearSport[yearStr]) articlesByYearSport[yearStr] = {};
          if (!articlesByYearSport[yearStr][sportStr]) articlesByYearSport[yearStr][sportStr] = [];
          articlesByYearSport[yearStr][sportStr].push({ ut, title });
        });

        const allYears = Object.keys(trendDataMap).sort((a, b) => a - b);
        const sportsSet = new Set();
        allYears.forEach((year) => {
          Object.keys(trendDataMap[year]).forEach((sport) => sportsSet.add(sport));
        });

        const sports = Array.from(sportsSet).sort();

        const formattedData = allYears.map((year) => {
          const row = { year };
          sports.forEach((sport) => {
            row[sport] = trendDataMap[year][sport] || 0;
          });
          return row;
        });

        setAvailableSports(sports);
        setSelectedSport(sports[0] || '');
        setChartData(formattedData);
        setArticlesMap(articlesByYearSport);
      })
      .catch(() => setError('database connection error'));
  }, [credentials]);

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
    return <p>Loading sport trends...</p>;
  }

  const handlePointClick = (data) => {
    if (!data || !data.activeLabel) return;
    setSelectedYear(data.activeLabel);
  };

  const selectedArticles =
    selectedYear && selectedSport && articlesMap[selectedYear]
      ? articlesMap[selectedYear][selectedSport] || []
      : [];

  return (
    <div className="w-full max-w-6xl h-[600px] bg-white p-6 rounded shadow-md flex overflow-hidden">
      {/* Chart Area */}
      <div
        className="transition-all duration-500 ease-in-out"
        style={{
          flexGrow: selectedYear ? 1 : 'unset',
          width: selectedYear ? '70%' : '100%',
          minWidth: 0,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Article Trends by Sport Over Years</h2>
          <select
            value={selectedSport}
            onChange={(e) => {
              setSelectedSport(e.target.value);
              setSelectedYear(null);
            }}
            className="border border-gray-300 rounded px-3 py-1"
          >
            {availableSports.map((sport) => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
        </div>

        <ResponsiveContainer width="100%" height="90%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            onClick={handlePointClick}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {selectedSport && (
              <Line
                type="monotone"
                dataKey={selectedSport}
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                cursor="pointer"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sidebar */}
      {selectedYear && (
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



/* import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function ArticleTrendsBySport({ credentials, onLogout }) {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState('');
  const [availableSports, setAvailableSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState('');

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
        const trendDataMap = {};

        json.forEach(({ year, sport }) => {
          if (!year || !sport) return;

          const yearStr = String(year).trim();
          const sportStr = sport.trim();

          if (sportStr === 'None') return; // skip None

          if (!trendDataMap[yearStr]) trendDataMap[yearStr] = {};
          trendDataMap[yearStr][sportStr] = (trendDataMap[yearStr][sportStr] || 0) + 1;
        });

        const allYears = Object.keys(trendDataMap).sort((a, b) => a - b);
        const sportsSet = new Set();
        allYears.forEach((year) => {
          Object.keys(trendDataMap[year]).forEach((sport) => sportsSet.add(sport));
        });

        const sports = Array.from(sportsSet).sort();

        const formattedData = allYears.map((year) => {
          const row = { year };
          sports.forEach((sport) => {
            row[sport] = trendDataMap[year][sport] || 0;
          });
          return row;
        });

        setAvailableSports(sports);
        setSelectedSport(sports[0] || '');
        setChartData(formattedData);
      })
      .catch(() => setError('database connection error'));
  }, [credentials]);

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
    return <p>Loading sport trends...</p>;
  }

  return (
    <div className="w-full max-w-6xl h-[600px] bg-white p-6 rounded shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Article Trends by Sport Over Years</h2>

        <select
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1"
        >
          {availableSports.map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          {selectedSport && (
            <Line type="monotone" dataKey={selectedSport} stroke="#8884d8" activeDot={{ r: 8 }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ArticleTrendsBySport;
*/ 