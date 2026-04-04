import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('syncly_token');
    if (!token) { setLoading(false); return; }
    api('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('syncly_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('syncly_token', token);
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const { token, user } = await api('/auth/register', { method: 'POST', body: { name, email, password } });
    localStorage.setItem('syncly_token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('syncly_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
