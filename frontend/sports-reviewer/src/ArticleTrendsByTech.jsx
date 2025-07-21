import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function ArticleTrendsByTechnology({ credentials, onLogout }) {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState('');
  const [availableTechnologies, setAvailableTechnologies] = useState([]);
  const [selectedTechnology, setSelectedTechnology] = useState('');

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
        const techDataMap = {};

        json.forEach(({ year, technology }) => {
          if (!year || !technology) return;

          const yearStr = String(year).trim();

          
          const techList = technology
            .split(',')
            .map((t) => t.trim())
            
            .filter((t) => t !== '["None"]' && t !== '');

          if (techList.length === 0) return;

          if (!techDataMap[yearStr]) techDataMap[yearStr] = {};

          techList.forEach((tech) => {
            techDataMap[yearStr][tech] = (techDataMap[yearStr][tech] || 0) + 1;
          });
        });

        const allYears = Object.keys(techDataMap).sort((a, b) => a - b);
        const techSet = new Set();
        allYears.forEach((year) => {
          Object.keys(techDataMap[year]).forEach((tech) => techSet.add(tech));
        });

        const technologies = Array.from(techSet).sort();

        const formattedData = allYears.map((year) => {
          const row = { year };
          technologies.forEach((tech) => {
            row[tech] = techDataMap[year][tech] || 0;
          });
          return row;
        });

        setAvailableTechnologies(technologies);
        setSelectedTechnology(technologies[0] || '');
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
    return <p>Loading technology trends...</p>;
  }

  return (
    <div className="w-full max-w-6xl h-[600px] bg-white p-6 rounded shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Article Trends by Technology Over Years</h2>

        <select
          value={selectedTechnology}
          onChange={(e) => setSelectedTechnology(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1"
        >
          {availableTechnologies.map((tech) => (
            <option key={tech} value={tech}>
              {tech}
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
          {selectedTechnology && (
            <Line
              type="monotone"
              dataKey={selectedTechnology}
              stroke="#82ca9d"
              activeDot={{ r: 8 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ArticleTrendsByTechnology;