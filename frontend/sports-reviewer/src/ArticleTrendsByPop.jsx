import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function ArticleTrendsByPop({ credentials, onLogout }) {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState('');
  const [availablePopulations, setAvailablePopulations] = useState([]);
  const [selectedPopulation, setSelectedPopulation] = useState('');
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
        const articlesByYearPopulation = {};

        data.forEach(({ year, population, ut, title }) => {
          if (!year || !population) return;

          const yearStr = String(year).trim();
          const populationStr = population.trim();

          if (populationStr === 'None') return;

          if (!trendDataMap[yearStr]) trendDataMap[yearStr] = {};
          trendDataMap[yearStr][populationStr] = (trendDataMap[yearStr][populationStr] || 0) + 1;

          if (!articlesByYearPopulation[yearStr]) articlesByYearPopulation[yearStr] = {};
          if (!articlesByYearPopulation[yearStr][populationStr]) {
            articlesByYearPopulation[yearStr][populationStr] = [];
          }
          articlesByYearPopulation[yearStr][populationStr].push({ ut, title });
        });

        const allYears = Object.keys(trendDataMap).sort((a, b) => a - b);
        const populationSet = new Set();
        allYears.forEach((year) => {
          Object.keys(trendDataMap[year]).forEach((population) => populationSet.add(population));
        });

        const populations = Array.from(populationSet).sort();

        const formattedData = allYears.map((year) => {
          const row = { year };
          populations.forEach((pop) => {
            row[pop] = trendDataMap[year][pop] || 0;
          });
          return row;
        });

        setAvailablePopulations(populations);
        setSelectedPopulation(populations[0] || '');
        setChartData(formattedData);
        setArticlesMap(articlesByYearPopulation);
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
    return <p>Loading population trends...</p>;
  }

  const handlePointClick = (data) => {
    if (!data || !data.activeLabel) return;
    setSelectedYear(data.activeLabel);
  };

  const selectedArticles =
    selectedYear && selectedPopulation && articlesMap[selectedYear]
      ? articlesMap[selectedYear][selectedPopulation] || []
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
          <h2 className="text-2xl font-bold">Article Trends by Population Over Years</h2>

          <select
            value={selectedPopulation}
            onChange={(e) => {
              setSelectedPopulation(e.target.value);
              setSelectedYear(null);
            }}
            className="border border-gray-300 rounded px-3 py-1"
          >
            {availablePopulations.map((pop) => (
              <option key={pop} value={pop}>
                {pop}
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
            {selectedPopulation && (
              <Line
                type="monotone"
                dataKey={selectedPopulation}
                stroke="#82ca9d"
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
        >
          <button
            className="mb-4 text-gray-600 hover:text-gray-900"
            onClick={() => setSelectedYear(null)}
          >
            &larr; Close
          </button>

          <h3 className="text-xl font-semibold mb-2">
            Articles for {selectedPopulation} in {selectedYear}
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
            <p>No articles available for this population and year.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ArticleTrendsByPop;
