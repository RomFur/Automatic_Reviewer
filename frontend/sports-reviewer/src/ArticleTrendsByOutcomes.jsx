import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function ArticleTrendsByOutcomes({ credentials, onLogout }) {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState('');
  const [availableOutcomes, setAvailableOutcomes] = useState([]);
  const [selectedOutcome, setSelectedOutcome] = useState('');
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
        const trendDataMap = {};
        const articlesByYearOutcome = {};

        json.forEach(({ year, outcome, ut, title }) => {
          if (!year || !outcome) return;

          const yearStr = String(year).trim();
          const outcomesList = outcome
            .split(',')
            .map((o) => o.trim())
            .filter((o) => o && o.toLowerCase() !== 'none');

          if (outcomesList.length === 0) return;

          if (!trendDataMap[yearStr]) trendDataMap[yearStr] = {};
          if (!articlesByYearOutcome[yearStr]) articlesByYearOutcome[yearStr] = {};

          outcomesList.forEach((singleOutcome) => {
            trendDataMap[yearStr][singleOutcome] = (trendDataMap[yearStr][singleOutcome] || 0) + 1;

            if (!articlesByYearOutcome[yearStr][singleOutcome]) {
              articlesByYearOutcome[yearStr][singleOutcome] = [];
            }
            articlesByYearOutcome[yearStr][singleOutcome].push({ ut, title });
          });
        });

        const allYears = Object.keys(trendDataMap).sort((a, b) => a - b);
        const outcomesSet = new Set();
        allYears.forEach((year) => {
          Object.keys(trendDataMap[year]).forEach((outcome) => outcomesSet.add(outcome));
        });

        const outcomes = Array.from(outcomesSet).sort();

        if (outcomes.length === 0) {
          setError('No outcome data available');
          return;
        }

        const formattedData = allYears.map((year) => {
          const row = { year };
          outcomes.forEach((outcome) => {
            row[outcome] = trendDataMap[year][outcome] || 0;
          });
          return row;
        });

        setAvailableOutcomes(outcomes);
        setSelectedOutcome(outcomes[0] || '');
        setChartData(formattedData);
        setArticlesMap(articlesByYearOutcome);
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

  if (!chartData || !selectedOutcome) {
    return <p>Loading outcome trends...</p>;
  }

  const handlePointClick = (data) => {
    if (!data || !data.activeLabel) return;
    setSelectedYear(data.activeLabel);
  };

  const selectedArticles =
    selectedYear && selectedOutcome && articlesMap[selectedYear]
      ? articlesMap[selectedYear][selectedOutcome] || []
      : [];

  return (
    <div className="w-full max-w-6xl h-[600px] bg-white p-6 rounded shadow-md flex overflow-hidden">
      {/* Chart area */}
      <div
        className="transition-all duration-500 ease-in-out"
        style={{
          flexGrow: selectedYear ? 1 : 'unset',
          width: selectedYear ? '70%' : '100%',
          minWidth: 0,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Article Trends by Outcome Over Years</h2>

          <select
            value={selectedOutcome}
            onChange={(e) => {
              setSelectedOutcome(e.target.value);
              setSelectedYear(null);
            }}
            className="border border-gray-300 rounded px-3 py-1"
          >
            {availableOutcomes.map((outcome) => (
              <option key={outcome} value={outcome}>
                {outcome}
              </option>
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
            {selectedOutcome && (
              <Line
                type="monotone"
                dataKey={selectedOutcome}
                stroke="#ffc658"
                activeDot={{ r: 8 }}
                cursor="pointer"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sidebar */}
      {selectedYear && (
        <div
          className="w-[30%] bg-gray-50 border-l border-gray-300 p-6 overflow-y-auto"
          style={{ minWidth: 0 }}
        >
          <button
            className="mb-4 text-gray-600 hover:text-gray-900"
            onClick={() => setSelectedYear(null)}
          >
            &larr; Close
          </button>

          <h3 className="text-xl font-semibold mb-2">
            Articles for {selectedOutcome} in {selectedYear}
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
            <p>No articles available for this outcome and year.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ArticleTrendsByOutcomes;
