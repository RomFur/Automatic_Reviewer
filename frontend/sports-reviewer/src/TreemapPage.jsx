import React, { useEffect, useState } from 'react';
import { Treemap, Tooltip, ResponsiveContainer } from 'recharts';

function TreemapPage({ credentials, onLogout }) {
  const [chartData, setChartData] = useState(null);
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
        const sportCount = {};
        json.forEach((item) => {
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
      })
      .catch(() => setError('database connection error'));
  }, [credentials]);

  if (error) {
    return (
      <div className="bg-white p-6 rounded shadow-md text-center max-w-md">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button
          onClick={onLogout}
          className="bg-gray-700 text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!chartData) {
    return <p>Loading articles...</p>;
  }

  return (
    <div className="w-full max-w-6xl h-[800px] bg-white p-0 rounded shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Sports Treemap</h2>
        <button
          onClick={onLogout}
          className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={chartData}
          dataKey="size"
          ratio={4 / 3}
          stroke="#fff"
          fill="#8884d8"
        >
          <Tooltip />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );

}

export default TreemapPage;
