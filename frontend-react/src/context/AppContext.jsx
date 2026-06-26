import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const initialToken = localStorage.getItem('token');
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true' && !!initialToken);
  const [activeRole, setActiveRole] = useState(localStorage.getItem('activeRole') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || null);
  const [token, setToken] = useState(initialToken || null);
  
  if (initialToken && !axios.defaults.headers.common['Authorization']) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
  }
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [businessData, setBusinessData] = useState(null);
  const [globalChatPrompt, setGlobalChatPrompt] = useState(null);
  
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bookmarks')) || []; }
    catch { return []; }
  });
  
  const [customBriefings, setCustomBriefings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('customBriefings')) || []; }
    catch { return []; }
  });
  
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  
  // Axios interceptor for JWT and 401 auto-logout
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token expired or invalid, auto-logout
          setToken(null);
          setIsAuthenticated(false);
          setActiveRole(null);
          setUsername(null);
          localStorage.clear(); // Ensure everything is wiped
          window.location.href = '/login'; // Force redirect to login
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);
  
  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeRole) localStorage.setItem('activeRole', activeRole);
    else localStorage.removeItem('activeRole');
  }, [activeRole]);

  useEffect(() => {
    if (username) localStorage.setItem('username', username);
    else localStorage.removeItem('username');
  }, [username]);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('customBriefings', JSON.stringify(customBriefings));
  }, [customBriefings]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setActiveRole(null);
    setUsername(null);
    setToken(null);
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      setIsAuthenticated,
      activeRole,
      setActiveRole,
      username,
      setUsername,
      token,
      setToken,
      theme,
      toggleTheme,
      businessData,
      setBusinessData,
      globalChatPrompt,
      setGlobalChatPrompt,
      bookmarks,
      setBookmarks,
      customBriefings,
      setCustomBriefings,
      toasts,
      addToast,
      removeToast,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};
