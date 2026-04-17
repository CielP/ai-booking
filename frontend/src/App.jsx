import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import AvailableRooms from './pages/AvailableRooms';
import BookRoom from './pages/BookRoom';
import MyBookings from './pages/MyBookings';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ChatWidget from './components/ChatWidget';
import './index.css';

const NAV_ITEMS = [
  { id: 'available',  label: '查詢空房', icon: '🔍', show: () => true },
  { id: 'book',       label: '預訂房間', icon: '📝', show: (u) => !!u },
  { id: 'mybookings', label: '我的訂單', icon: '📋', show: (u) => !!u },
  { id: 'admin',      label: '管理後台', icon: '⚙️', show: (u) => u?.role === 'admin' },
];

export default function App() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [bookPrefill, setBookPrefill] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    return localStorage.getItem('sidebarExpanded') === 'true';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', sidebarExpanded);
  }, [sidebarExpanded]);

  function toggleTheme() {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }

  function toggleSidebar() {
    setSidebarExpanded(prev => !prev);
  }

  function handleBook(prefill) {
    setBookPrefill(prefill);
    setActiveTab('book');
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    logout();
    setActiveTab('available');
  }

  // 等待 auth 初始化
  if (user === undefined) {
    return (
      <div className="app-loading">
        <div className="app-loading-brand">🏔️ 山景旅宿</div>
        <div>
          <span className="spinner" /> 載入中…
        </div>
      </div>
    );
  }

  const visibleNav = NAV_ITEMS.filter(item => item.show(user));

  // 如果目前 tab 對登入狀態不適用，回到 available
  const authPages = ['login', 'register'];
  const validTab = visibleNav.find(t => t.id === activeTab) || (!user && authPages.includes(activeTab))
    ? activeTab
    : 'available';

  return (
    <div className="app-layout">
      {/* ── Navbar ──────────────────────── */}
      <nav className="navbar">
        <button className="navbar-hamburger" onClick={toggleSidebar} aria-label="切換選單">
          ☰
        </button>
        <div className="navbar-brand">
          <span>🏔️</span>
          <span className="navbar-brand-text">山景旅宿</span>
        </div>
        <div className="navbar-spacer" />
        <div className="navbar-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="切換主題">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {user ? (
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              {user.role === 'admin' && <span className="role-badge">管理者</span>}
              <button className="btn-logout" onClick={handleLogout}>登出</button>
            </div>
          ) : (
            <div className="auth-actions">
              <button className="btn-auth-outline" onClick={() => setActiveTab('login')}>登入</button>
              <button className="btn btn-primary" onClick={() => setActiveTab('register')}>註冊</button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Sidebar overlay (mobile) ───── */}
      <div
        className={`sidebar-overlay${sidebarExpanded ? ' visible' : ''}`}
        onClick={() => setSidebarExpanded(false)}
      />

      {/* ── Sidebar ────────────────────── */}
      <aside className={`sidebar${sidebarExpanded ? ' expanded' : ''}`}>
        <nav className="sidebar-nav">
          {visibleNav.map(item => (
            <button
              key={item.id}
              className={`sidebar-item${validTab === item.id ? ' active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 768) setSidebarExpanded(false);
              }}
              title={item.label}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ───────────────── */}
      <main className={`main-content${sidebarExpanded ? ' sidebar-expanded' : ''}`}>
        <div className="main-inner">
          {validTab === 'available'  && <AvailableRooms onBook={user ? handleBook : null} />}
          {validTab === 'book'       && <BookRoom prefill={bookPrefill} />}
          {validTab === 'mybookings' && <MyBookings />}
          {validTab === 'admin'      && <AdminDashboard />}
          {validTab === 'login'      && <Login onLogin={() => setActiveTab('available')} />}
          {validTab === 'register'   && <Register onRegister={() => setActiveTab('available')} />}
        </div>
      </main>

      {user?.role === 'admin' && <ChatWidget activeTab={validTab} bookPrefill={bookPrefill} />}
    </div>
  );
}
