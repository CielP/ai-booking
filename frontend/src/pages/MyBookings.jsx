import { useState, useEffect } from 'react';

export default function MyBookings() {
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    fetch('/api/bookings', { credentials: 'include' })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error);
        setBookings(data.bookings);
      })
      .catch(err => setError(err.message || '查詢失敗，請稍後再試'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(id) {
    if (!window.confirm('確定要取消此訂單嗎？')) return;
    setCancelError('');
    setCancellingId(id);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      setCancelError(err.message || '取消失敗，請稍後再試');
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
        <span className="spinner" /> 載入中…
      </div>
    );
  }

  return (
    <div className="card">
      {error && <div className="alert alert-error">{error}</div>}
      {cancelError && <div className="alert alert-error">{cancelError}</div>}

      {bookings !== null && (
        bookings.length === 0 ? (
          <div className="alert alert-info">
            目前尚無任何訂單記錄
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map(b => (
              <div key={b.id} className="booking-item">
                <div className="booking-header">
                  <span className="booking-id">{b.id}</span>
                  <span className={`status-badge status-${b.status}`}>
                    {b.status === 'active' ? '有效' : '已取消'}
                  </span>
                </div>
                <div className="booking-details">
                  <div>房間：{b.room_number} 號房</div>
                  <div>姓名：{b.guest_name}</div>
                  <div>入住：{b.check_in} ／ 退房：{b.check_out}</div>
                  {b.notes && <div>備注：{b.notes}</div>}
                </div>
                {b.status === 'active' && (
                  <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleCancel(b.id)}
                      disabled={cancellingId === b.id}
                    >
                      {cancellingId === b.id && <span className="spinner" />}
                      取消訂單
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
