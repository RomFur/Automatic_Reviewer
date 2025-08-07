import React, { useEffect, useState } from 'react';
import { Treemap, Tooltip, ResponsiveContainer } from 'recharts';

function TreemapPage({ credentials }) {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState('');
  const [choices, setChoices] = useState(null);
  const [filters, setFilters] = useState({
    startYear: '',
    endYear: '',
    technology: '',
    population: '',
    outcome: '',
  });

  const [selectedSport, setSelectedSport] = useState(null);
  const [allArticles, setAllArticles] = useState([]);

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
        setAllArticles(json.articles);

        const sportCount = {};
        json.articles.forEach((item) => {
          const sport = item.sport;
          if (sport && sport !== 'None') {
            sportCount[sport] = (sportCount[sport] || 0) + 1;
          }
        });

        const formatted = Object.entries(sportCount).map(([name, size]) => ({
          name,
          size,
        }));

        setChartData(formatted);
        setChoices(json.filters);
      })
      .catch(() => setError('database connection error'));
  }, [credentials]);

  const handleFilter = () => {
    const headers = {
      'x-db-host': credentials.host,
      'x-db-database': credentials.database,
      'x-db-user': credentials.user,
      'x-db-password': credentials.password,
    };

    const params = new URLSearchParams();
    if (filters.startYear) params.append('start_year', filters.startYear);
    if (filters.endYear) params.append('end_year', filters.endYear);
    if (filters.technology) params.append('technology', filters.technology);
    if (filters.population) params.append('population', filters.population);
    if (filters.outcome) params.append('outcome', filters.outcome);

    fetch(`http://localhost:8000/articles/filter/?${params.toString()}`, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error('filtering error');
        return res.json();
      })
      .then((filteredArticles) => {
        setAllArticles(filteredArticles); 

        const sportCount = {};
        filteredArticles.forEach((item) => {
          const sport = item.sport;
          if (sport && sport !== 'None') {
            sportCount[sport] = (sportCount[sport] || 0) + 1;
          }
        });

        const formatted = Object.entries(sportCount).map(([name, size]) => ({
          name,
          size,
        }));

        setChartData(formatted);
        setSelectedSport(null); /
      })
      .catch(() => setError('database connection error'));
  };

  if (error) {
    return (
      <div className="bg-white p-6 rounded shadow-md text-center max-w-md">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-700 text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!chartData || !choices) {
    return <p>Loading articles...</p>;
  }

  const selectedArticles = selectedSport
    ? allArticles.filter((a) => a.sport === selectedSport)
    : [];

  return (
    <div className="w-full max-w-6xl mx-auto h-[900px] bg-white p-6 rounded shadow-md relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Sports Treemap</h2>
      </div>

      {/* Filter controls */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <input
          type="number"
          placeholder="Start Year"
          value={filters.startYear}
          onChange={(e) => setFilters({ ...filters, startYear: e.target.value })}
          className="border px-2 py-1 rounded"
        />
        <input
          type="number"
          placeholder="End Year"
          value={filters.endYear}
          onChange={(e) => setFilters({ ...filters, endYear: e.target.value })}
          className="border px-2 py-1 rounded"
        />
        <select
          value={filters.technology}
          onChange={(e) => setFilters({ ...filters, technology: e.target.value })}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Technologies</option>
          {choices.technologies.map((tech) => (
            <option key={tech} value={tech}>{tech}</option>
          ))}
        </select>
        <select
          value={filters.population}
          onChange={(e) => setFilters({ ...filters, population: e.target.value })}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Populations</option>
          {choices.populations.map((pop) => (
            <option key={pop} value={pop}>{pop}</option>
          ))}
        </select>
        <select
          value={filters.outcome}
          onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Outcomes</option>
          {choices.outcomes.map((out) => (
            <option key={out} value={out}>{out}</option>
          ))}
        </select>
        <button
          onClick={handleFilter}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>

      {/* Treemap chart */}
      <ResponsiveContainer width="100%" height={700}>
        <Treemap
          data={chartData}
          dataKey="size"
          ratio={4 / 3}
          stroke="#fff"
          fill="#8884d8"
          onClick={(node) => setSelectedSport(node.name)}
        >
          <Tooltip />
        </Treemap>
      </ResponsiveContainer>

      {/* Sidebar */}
      {selectedSport && (
        <div className="fixed right-0 top-0 h-full w-[30%] bg-gray-50 border-l border-gray-300 p-6 overflow-y-auto shadow-lg z-50">
          <button
            onClick={() => setSelectedSport(null)}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            &larr; Back
          </button>
          <h3 className="text-xl font-semibold mb-2">
            Articles for {selectedSport}
          </h3>
          {selectedArticles.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 max-h-[85vh] overflow-y-auto">
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
            <p>No articles available for {selectedSport}.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default TreemapPage;
