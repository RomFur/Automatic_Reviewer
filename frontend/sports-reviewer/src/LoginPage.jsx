import React, { useState } from 'react';

function LoginPage({ onLogin }) {
  const [host, setHost] = useState('localhost');
  const [database, setDatabase] = useState('articles_db');
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ host, database, user, password });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">Connect to Database</h2>

      <label className="block mb-2">
        Host
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2"
          required
        />
      </label>

      <label className="block mb-2">
        Database
        <input
          type="text"
          value={database}
          onChange={(e) => setDatabase(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2"
          required
        />
      </label>

      <label className="block mb-2">
        User
        <input
          type="text"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2"
          required
        />
      </label>

      <label className="block mb-4">
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>

      <button
        type="submit"
        className="bg-blue-600 text-white w-full py-2 px-4 rounded hover:bg-blue-700"
      >
        Connect
      </button>
    </form>
  );
}

export default LoginPage;
