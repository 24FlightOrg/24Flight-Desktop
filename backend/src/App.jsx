import React from 'react';

export default function App() {
  return (
    <div>
      <h1>Hello from React + Electron (ESM) 👋</h1>
      <p>Ping → {window.api?.ping()}</p>
    </div>
  );
}
