import { useState } from 'react';

export default function Layout({ user, onLogout, tabs, activeTab, onTabChange, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const roleColors = {
    mahasiswa: 'bg-blue-600',
    dosen: 'bg-emerald-600',
    admin: 'bg-purple-600',
    kaprodi: 'bg-purple-600',
  };

  const roleLabel = user?.roles?.[0] || user?.type || 'User';
  const headerColor = user?.type === 'mahasiswa' ? roleColors.mahasiswa :
                       user?.roles?.includes('Admin') || user?.roles?.includes('Kaprodi') ? roleColors.admin :
                       roleColors.dosen;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`${headerColor} text-white shadow`}>
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded"
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <div>
              <h1 className="text-xl font-bold">SIA Petra</h1>
              <p className="text-xs opacity-80">Sistem Informasi Akademik</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium">{user?.username}</p>
              <p className="opacity-80">{roleLabel} • {user?.type}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-screen-2xl mx-auto">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-64 bg-white shadow-sm min-h-screen p-4`}>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition flex items-center gap-3 ${
                  activeTab === tab.id
                    ? `${headerColor} text-white`
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
