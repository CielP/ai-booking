import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login({ onLogin }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('請填寫 Email 與密碼');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.user);
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message || '登入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card auth-card">
      <h2 className="auth-title">登入</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="your@email.com"
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label>密碼</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="請輸入密碼"
            autoComplete="current-password"
          />
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading && <span className="spinner" />}
          登入
        </button>
      </form>
    </div>
  );
}
