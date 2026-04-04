import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F6F3' },
  card: { background: '#fff', borderRadius: 16, border: '0.5px solid rgba(0,0,0,0.10)', padding: '2.5rem', width: 380, maxWidth: '92vw' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.8rem', justifyContent: 'center' },
  logoIcon: { width: 36, height: 36, background: '#185FA5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tabs: { display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '0.5px solid rgba(0,0,0,0.10)' },
  tab: (active) => ({ flex: 1, textAlign: 'center', padding: '8px', cursor: 'pointer', fontSize: 14, fontWeight: active ? 500 : 400, color: active ? '#185FA5' : '#6B6A64', borderBottom: active ? '2px solid #185FA5' : '2px solid transparent', marginBottom: -1 }),
  label: { fontSize: 12, fontWeight: 500, color: '#6B6A64', display: 'block', marginBottom: 4 },
  input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: 14, fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box', outline: 'none' },
  btn: { width: '100%', padding: '10px', borderRadius: 8, background: '#185FA5', color: '#fff', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  error: { background: '#FCEBEB', border: '0.5px solid #F09595', color: '#791F1F', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }
};

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (tab === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="white"><path d="M8 1L2 5v6l6 4 6-4V5L8 1zm0 2.2l4 2.7v4.2L8 12.6 4 10.1V5.9L8 3.2z"/></svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.3 }}>Syncly</span>
        </div>
        <div style={styles.tabs}>
          <div style={styles.tab(tab === 'login')} onClick={() => setTab('login')}>Accedi</div>
          <div style={styles.tab(tab === 'register')} onClick={() => setTab('register')}>Registrati</div>
        </div>
        <form onSubmit={submit}>
          {error && <div style={styles.error}>{error}</div>}
          {tab === 'register' && (
            <>
              <label style={styles.label}>Nome completo</label>
              <input style={styles.input} placeholder="Mario Rossi" value={form.name} onChange={set('name')} required />
            </>
          )}
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="mario@azienda.com" value={form.email} onChange={set('email')} required />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Caricamento...' : tab === 'login' ? 'Accedi' : 'Crea account'}
          </button>
        </form>
      </div>
    </div>
  );
}
