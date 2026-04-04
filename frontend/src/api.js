const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const api = async (path, options = {}) => {
  const token = localStorage.getItem('syncly_token');
  const res = await fetch(`${BASE}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Errore di rete');
  }
  return res.json();
};

export default api;
