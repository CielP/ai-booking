import { useState } from 'react';

export default function CancelBooking() {
  const [bookingId, setBookingId] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(null);

  function validate() {
    const e = {};
    if (!bookingId.trim()) e.bookingId = '請填寫訂單編號';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    setSuccess(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId.trim())}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.booking);
      setBookingId('');
    } catch (err) {
      setApiError(err.message || '取消失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      {success && (
        <div className="alert alert-success">
          訂單 <strong>{success.id.slice(0, 8)}…</strong> 已成功取消。
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>訂單編號 *</label>
          <input
            value={bookingId}
            onChange={e => setBookingId(e.target.value)}
            placeholder="請輸入訂單編號（UUID）"
          />
          {errors.bookingId && <span style={{ color: '#dc2626', fontSize: '0.82rem' }}>{errors.bookingId}</span>}
        </div>
        {apiError && <div className="alert alert-error">{apiError}</div>}
        <button className="btn btn-danger" type="submit" disabled={loading}>
          {loading && <span className="spinner" />}
          確認取消訂單
        </button>
      </form>
    </div>
  );
}
