import { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import AvailableRooms from './pages/AvailableRooms';
import BookRoom from './pages/BookRoom';
import MyBookings from './pages/MyBookings';
import CancelBooking from './pages/CancelBooking';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

export default function App() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [bookPrefill, setBookPrefill] = useState(null);

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
      <div className="app">
        <h1>🏨 旅館訂房系統</h1>
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          <span className="spinner" /> 載入中…
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'available', label: '查詢空房', show: true },
    { id: 'book',      label: '預訂房間', show: !!user },
    { id: 'mybookings',label: '我的訂單', show: !!user },
    { id: 'cancel',    label: '取消訂單', show: !!user },
    { id: 'admin',     label: '管理後台', show: user?.role === 'admin' },
  ].filter(t => t.show);

  // 如果目前 tab 對登入狀態不適用，回到 available
  // login/register 不在 tabs 中但仍為有效的 activeTab（由 header 按鈕觸發）
  const authPages = ['login', 'register'];
  const validTab = tabs.find(t => t.id === activeTab) || (!user && authPages.includes(activeTab))
    ? activeTab
    : 'available';

  return (
    <div className="app">
      <div className="app-header">
        <h1>🏨 旅館訂房系統</h1>
        {user ? (
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            {user.role === 'admin' && <span className="role-badge">管理者</span>}
            <button className="btn btn-logout" onClick={handleLogout}>登出</button>
          </div>
        ) : (
          <div className="auth-actions">
            <button className="btn btn-auth-outline" onClick={() => setActiveTab('login')}>登入</button>
            <button className="btn btn-primary" onClick={() => setActiveTab('register')}>註冊</button>
          </div>
        )}
      </div>
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${validTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {validTab === 'available'  && <AvailableRooms onBook={user ? handleBook : null} />}
      {validTab === 'book'       && <BookRoom prefill={bookPrefill} />}
      {validTab === 'mybookings' && <MyBookings />}
      {validTab === 'cancel'     && <CancelBooking />}
      {validTab === 'admin'      && <AdminDashboard />}
      {validTab === 'login'      && <Login onLogin={() => setActiveTab('available')} />}
      {validTab === 'register'   && <Register onRegister={() => setActiveTab('available')} />}
    </div>
  );
}
