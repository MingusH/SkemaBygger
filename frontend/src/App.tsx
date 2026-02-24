import React from 'react';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>SkemaBygger</h1>
        <p>Skemalægningssystem for folkeskoler</p>
      </header>
      <main>
        <AdminPanel />
      </main>
    </div>
  );
}

export default App;
