import React, { useState } from 'react';
import LoginPage from './LoginPage.jsx';
import TreemapPage from './TreemapPage.jsx';
import TechTreemapPage from './TechTreemapPage.jsx';
import PopTreemapPage from './PopTreemapPage.jsx';
import OutcomeTreemapPage from './OutcomeTreemapPage.jsx';
import ArticleTrendsBySport from './ArticleTrendsBySport.jsx';
import ArticleTrendsByTechnology from './ArticleTrendsByTech.jsx';

function App() {
  const [credentials, setCredentials] = useState(null);
  const [activeTab, setActiveTab] = useState('treemap');

  const handleTreemapChange = (e) => {
    const value = e.target.value;
    if (value !== '') setActiveTab(value);
  };

  const handleTrendsChange = (e) => {
    const value = e.target.value;
    if (value !== '') setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {!credentials ? (
        <div className="flex justify-center items-center h-screen">
          <LoginPage onLogin={setCredentials} />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4 items-center">
              {/* Treemap Dropdown */}
              <select
                value={['treemap', 'techTreemap', 'popTreemap', 'outcomeTreemap'].includes(activeTab) ? activeTab : ''}
                onChange={handleTreemapChange}
                className="px-4 py-2 rounded bg-white border border-gray-300 text-gray-700"
              >
                <option value="">Treemaps</option>
                <option value="treemap">Sport Treemap</option>
                <option value="techTreemap">Technology Treemap</option>
                <option value="popTreemap">Population Treemap</option>
                <option value="outcomeTreemap">Outcome Treemap</option>
              </select>

              {/* Trends Dropdown */}
              <select
                value={['sport', 'technology'].includes(activeTab) ? activeTab : ''}
                onChange={handleTrendsChange}
                className="px-4 py-2 rounded bg-white border border-gray-300 text-gray-700"
              >
                <option value="">Trends</option>
                <option value="sport">Sport Trends</option>
                <option value="technology">Technology Trends</option>
              </select>
            </div>

            {/* Logout */}
            <button
              onClick={() => setCredentials(null)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Disconnect
            </button>
          </div>

          <div>
            {activeTab === 'treemap' && <TreemapPage credentials={credentials} />}
            {activeTab === 'techTreemap' && <TechTreemapPage credentials={credentials} />}
            {activeTab === 'popTreemap' && <PopTreemapPage credentials={credentials} />}
            {activeTab === 'outcomeTreemap' && <OutcomeTreemapPage credentials={credentials} />}
            {activeTab === 'sport' && (
              <ArticleTrendsBySport credentials={credentials} onLogout={() => setCredentials(null)} />
            )}
            {activeTab === 'technology' && (
              <ArticleTrendsByTechnology credentials={credentials} onLogout={() => setCredentials(null)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
