import React, { useState } from 'react';
import './App.css';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function App() {
  const { isAuthenticated, token, login, logout } = useAuth();
  const [currentView, setCurrentView] = useState('login'); // 'login' or 'register'

  if (isAuthenticated) {
    return <Dashboard token={token} logout={logout} />;
  }

  return (
    <div className="app-container">
      {currentView === 'login' ? (
        <Login login={login} setCurrentView={setCurrentView} />
      ) : (
        <Register login={login} setCurrentView={setCurrentView} />
      )}
    </div>
  );
}

export default App;
