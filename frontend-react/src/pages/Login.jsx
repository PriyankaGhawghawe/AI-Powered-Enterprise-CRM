import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { FaUser, FaLock, FaRightToBracket, FaCircleNotch, FaBrain } from 'react-icons/fa6';

const Login = () => {
  const { setActiveRole, setUsername, setToken, setIsAuthenticated } = useContext(AppContext);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/auth/login', {
        username: formUsername,
        password: formPassword
      });
      
      const { access_token, role, username, requires_password_reset } = response.data;
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      localStorage.setItem('token', access_token);
      
      setToken(access_token);
      setUsername(username);
      setActiveRole(role);
      setIsAuthenticated(true);
      
      if (requires_password_reset) {
        navigate('/reset-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 p-4">
      
      {/* Animated Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative w-full max-w-md bg-slate-900/50 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-10 text-center transition-all duration-500 hover:shadow-[0_8px_32px_0_rgba(59,130,246,0.15)] z-10">
        
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/30 transform transition-transform hover:scale-105 hover:rotate-3">
          <FaBrain className="text-white text-4xl" />
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
          Business<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">OS</span>
        </h1>
        <p className="text-slate-400 text-sm mb-8 font-medium tracking-wide">Secure Executive Access Gateway</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-6 shadow-inner animate-fade-in">
            {error}
          </div>
        )}
        
        {isForgotPassword ? (
          <div className="animate-fade-in text-center p-4">
            <h3 className="text-xl font-bold text-white mb-4">Password Reset</h3>
            <p className="text-slate-300 mb-6 text-sm leading-relaxed">
              Please contact your system Administrator or Owner to reset your password. The system will automatically force you to set a new password on your next successful login.
            </p>
            <button 
              onClick={() => setIsForgotPassword(false)}
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold underline underline-offset-4 transition-colors"
            >
              &larr; Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5 animate-fade-in text-left">
            <div className="group">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2 ml-1 transition-colors group-focus-within:text-blue-400">
                <FaUser className="inline mr-2 text-slate-500 group-focus-within:text-blue-400 transition-colors" /> Username
              </label>
              <input 
                type="text" 
                placeholder="e.g. admin" 
                required 
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner transform focus:-translate-y-0.5"
              />
            </div>
            
            <div className="group">
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors group-focus-within:text-blue-400">
                  <FaLock className="inline mr-2 text-slate-500 group-focus-within:text-blue-400 transition-colors" /> Password
                </label>
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs text-slate-400 hover:text-blue-400 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner transform focus:-translate-y-0.5"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-8 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transform transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><FaCircleNotch className="animate-spin text-lg" /> Authenticating...</>
              ) : (
                <><FaRightToBracket className="text-lg" /> Secure Login</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
