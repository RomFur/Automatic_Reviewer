import React, { useState } from 'react';
import LoginPage from './LoginPage.jsx';
import TreemapPage from './TreemapPage.jsx';
import ArticleTrendsBySport from './ArticleTrendsBySport.jsx';
import ArticleTrendsByTechnology from './ArticleTrendsByTech.jsx';

function App() {
  const [credentials, setCredentials] = useState(null);
  const [activeTab, setActiveTab] = useState('treemap'); // treemap, sport, technology

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {!credentials ? (
        <div className="flex justify-center items-center h-screen">
          <LoginPage onLogin={setCredentials} />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-x-4">
              <button
                onClick={() => setActiveTab('treemap')}
                className={`px-4 py-2 rounded ${
                  activeTab === 'treemap'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Treemap
              </button>
              <button
                onClick={() => setActiveTab('sport')}
                className={`px-4 py-2 rounded ${
                  activeTab === 'sport'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Sport Trends
              </button>
              <button
                onClick={() => setActiveTab('technology')}
                className={`px-4 py-2 rounded ${
                  activeTab === 'technology'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Technology Trends
              </button>
            </div>
            <button
              onClick={() => setCredentials(null)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          <div>
            {activeTab === 'treemap' && <TreemapPage credentials={credentials} />}
            {activeTab === 'sport' && <ArticleTrendsBySport credentials={credentials} onLogout={() => setCredentials(null)} />}
            {activeTab === 'technology' && <ArticleTrendsByTechnology credentials={credentials} onLogout={() => setCredentials(null)} />}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;