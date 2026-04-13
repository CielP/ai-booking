import { useState } from 'react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MyBookings() {
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    setBookings(null);

    if (!email.trim()) { setError('請填寫 Email'); return; }
    if (!EMAIL_REGEX.test(email)) { setError('Email 格式無效'); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookings(data.bookings);
    } catch (err) {
      setError(err.message || '查詢失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <form onSubmit={handleSearch}>
        <div className="form-group">
          <label>以 Email 查詢訂單</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="輸入預訂時填寫的 Email"
          />
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading && <span className="spinner" />}
          查詢訂單
        </button>
      </form>

      {bookings !== null && (
        bookings.length === 0 ? (
          <div className="alert alert-info" style={{ marginTop: '16px' }}>
            此 Email 無任何訂單記錄
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
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
