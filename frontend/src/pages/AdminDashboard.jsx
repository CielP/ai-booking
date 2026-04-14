import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');

  const tabs = [
    { id: 'bookings', label: '訂單管理' },
    { id: 'users',    label: '帳號管理' },
    { id: 'rooms',    label: '房間管理' },
  ];

  return (
    <div className="card">
      <div className="sub-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`sub-tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {activeTab === 'bookings' && <BookingsPanel />}
      {activeTab === 'users'    && <UsersPanel />}
      {activeTab === 'rooms'    && <RoomsPanel />}
    </div>
  );
}

// ── 訂單管理 ──────────────────────────────────────────
function BookingsPanel() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/bookings', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setBookings(d.bookings || []))
      .catch(() => setError('載入訂單失敗'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function cancelBooking(id) {
    if (!confirm('確定要取消這筆訂單？')) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      load();
    } catch (err) {
      alert(err.message || '取消失敗');
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '24px', color: '#888' }}><span className="spinner" /></div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>共 {bookings.length} 筆訂單</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>訂單編號</th>
            <th>房間</th>
            <th>旅客</th>
            <th>入住</th>
            <th>退房</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td><code style={{ fontSize: '0.78rem', color: '#888' }}>{b.id.slice(0, 8)}…</code></td>
              <td>{b.room_number} 號</td>
              <td>
                <div>{b.guest_name}</div>
                <div style={{ fontSize: '0.78rem', color: '#888' }}>{b.guest_email}</div>
              </td>
              <td>{b.check_in}</td>
              <td>{b.check_out}</td>
              <td>
                <span className={`status-badge status-${b.status}`}>
                  {b.status === 'active' ? '有效' : '已取消'}
                </span>
              </td>
              <td>
                {b.status === 'active' && (
                  <button
                    className="btn btn-danger"
                    style={{ padding: '4px 10px', fontSize: '0.82rem' }}
                    disabled={cancellingId === b.id}
                    onClick={() => cancelBooking(b.id)}
                  >
                    取消
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookings.length === 0 && <div className="alert alert-info" style={{ marginTop: '12px' }}>目前尚無訂單</div>}
    </div>
  );
}

// ── 帳號管理 ──────────────────────────────────────────
function UsersPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/users', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => setError('載入帳號失敗'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateUser(id, patch) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      load();
    } catch (err) {
      alert(err.message || '更新失敗');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '24px', color: '#888' }}><span className="spinner" /></div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>共 {users.length} 個帳號</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>Email</th>
            <th>角色</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <span className={`status-badge ${u.role === 'admin' ? 'role-admin-badge' : 'status-active'}`}
                  style={u.role === 'admin' ? { background: '#fef3c7', color: '#92400e' } : {}}>
                  {u.role === 'admin' ? '管理者' : '一般用戶'}
                </span>
              </td>
              <td>
                <span className={`status-badge ${u.is_active ? 'status-active' : 'status-cancelled'}`}>
                  {u.is_active ? '啟用' : '停用'}
                </span>
              </td>
              <td>
                {u.id !== currentUser?.id && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '4px 10px', fontSize: '0.82rem' }}
                      disabled={updatingId === u.id}
                      onClick={() => updateUser(u.id, { role: u.role === 'admin' ? 'guest' : 'admin' })}
                    >
                      {u.role === 'admin' ? '降為一般用戶' : '升為管理者'}
                    </button>
                    <button
                      className="btn"
                      style={{ padding: '4px 10px', fontSize: '0.82rem', background: u.is_active ? '#f3f4f6' : '#dcfce7', color: u.is_active ? '#555' : '#166534', border: '1px solid #ddd' }}
                      disabled={updatingId === u.id}
                      onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                    >
                      {u.is_active ? '停用帳號' : '重新啟用'}
                    </button>
                  </div>
                )}
                {u.id === currentUser?.id && <span style={{ color: '#aaa', fontSize: '0.82rem' }}>（目前帳號）</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 房間管理 ──────────────────────────────────────────
function RoomsPanel() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetch('/api/admin/rooms', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setRooms(d.rooms || []);
        const init = {};
        (d.rooms || []).forEach(r => { init[r.room_number] = r.description || ''; });
        setEditing(init);
      })
      .catch(() => setError('載入房間失敗'))
      .finally(() => setLoading(false));
  }, []);

  async function saveRoom(room_number) {
    setSavingId(room_number);
    try {
      const res = await fetch(`/api/admin/rooms/${room_number}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ description: editing[room_number] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRooms(prev => prev.map(r => r.room_number === room_number ? data.room : r));
    } catch (err) {
      alert(err.message || '儲存失敗');
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '24px', color: '#888' }}><span className="spinner" /></div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>房間號碼</th>
          <th>描述</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rooms.map(r => (
          <tr key={r.room_number}>
            <td style={{ fontWeight: 600 }}>{r.room_number} 號房</td>
            <td>
              <input
                value={editing[r.room_number] ?? r.description ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, [r.room_number]: e.target.value }))}
                style={{ width: '100%', padding: '6px 10px' }}
              />
            </td>
            <td>
              <button
                className="btn btn-primary"
                style={{ padding: '4px 12px', fontSize: '0.82rem' }}
                disabled={savingId === r.room_number || editing[r.room_number] === r.description}
                onClick={() => saveRoom(r.room_number)}
              >
                {savingId === r.room_number ? <span className="spinner" /> : '儲存'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
