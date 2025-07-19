import React, { useState } from 'react';
import LoginPage from './LoginPage.jsx';
import TreemapPage from './TreemapPage.jsx';

function App() {
  const [credentials, setCredentials] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {!credentials ? (
        <LoginPage onLogin={setCredentials} />
      ) : (
        <TreemapPage credentials={credentials} onLogout={() => setCredentials(null)} />
      )}
    </div>
  );
}

export default App;