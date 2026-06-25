import { useState } from 'react';
import Login from './pages/Login';
import MahasiswaDashboard from './pages/MahasiswaDashboard';
import DosenDashboard from './pages/DosenDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('jwt_token')
  );
  const [userInfo, setUserInfo] = useState(
    () => JSON.parse(localStorage.getItem('user_info') || 'null')
  );

  const handleLogin = () => {
    const info = JSON.parse(localStorage.getItem('user_info') || 'null');
    setUserInfo(info);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    setIsAuthenticated(false);
    setUserInfo(null);
  };

  if (!isAuthenticated || !userInfo) {
    return <Login onLogin={handleLogin} />;
  }

  // Mahasiswa → MahasiswaDashboard
  // Dosen (semua, termasuk yang punya role Admin/Kaprodi) → DosenDashboard
  if (userInfo.type === 'mahasiswa') {
    return <MahasiswaDashboard user={userInfo} onLogout={handleLogout} />;
  }
  if (userInfo.type === 'dosen') {
    return <DosenDashboard user={userInfo} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-6 max-w-md text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Role Tidak Dikenali</h2>
        <p className="text-gray-600 mb-4">Type: {userInfo.type}</p>
        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded">Logout</button>
      </div>
    </div>
  );
}

export default App;