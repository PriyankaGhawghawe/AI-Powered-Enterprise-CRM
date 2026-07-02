import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { FaUser, FaLock, FaRightToBracket, FaCircleNotch, FaBrain, FaChevronDown, FaArrowLeft } from 'react-icons/fa6';

const DEMO_ACCOUNTS = [
  {
    label: 'Owner',
    username: 'admin',
    password: 'admin',
    description: 'Full Access — AI agents, analytics, all settings',
    gradient: 'from-amber-500 to-orange-500',
    ring: 'focus:ring-amber-500/40 hover:border-amber-500/60',
    accent: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  {
    label: 'Manager',
    username: 'manager',
    password: 'manager',
    description: 'Limited Admin — Team management, reports, CRM',
    gradient: 'from-blue-500 to-indigo-500',
    ring: 'focus:ring-blue-500/40 hover:border-blue-500/60',
    accent: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  {
    label: 'Employee',
    username: 'employee',
    password: 'employee',
    description: 'Restricted — Tasks and personal dashboard only',
    gradient: 'from-emerald-500 to-teal-500',
    ring: 'focus:ring-emerald-500/40 hover:border-emerald-500/60',
    accent: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
];

const Login = () => {
  const { setActiveRole, setUsername, setToken, setIsAuthenticated } = useContext(AppContext);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null); // null = show role picker
  const navigate = useNavigate();

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setFormUsername(account.username);
    setFormPassword(account.password);
    setError(null);
  };

  const handleManualLogin = () => {
    setSelectedAccount('manual');
    setFormUsername('');
    setFormPassword('');
    setError(null);
  };

  const handleBack = () => {
    setSelectedAccount(null);
    setFormUsername('');
    setFormPassword('');
    setError(null);
    setIsForgotPassword(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', {
        username: formUsername,
        password: formPassword,
      });
      const { access_token, role, username: uname, requires_password_reset } = response.data;
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUsername(uname);
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

  const selectedInfo = DEMO_ACCOUNTS.find(a => a.username === selectedAccount?.username);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 p-4">

      {/* Animated Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative w-full max-w-md z-10">
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-10 text-center transition-all duration-500 hover:shadow-[0_8px_32px_0_rgba(59,130,246,0.15)]">

          {/* Logo */}
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/30 transform transition-transform hover:scale-105 hover:rotate-3">
            <FaBrain className="text-white text-4xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            Business<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">OS</span>
          </h1>
          <p className="text-slate-400 text-sm mb-8 font-medium tracking-wide">Secure Executive Access Gateway</p>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-6 shadow-inner">
              {error}
            </div>
          )}

          {/* ── STEP 1: Role Picker ── */}
          {!selectedAccount && (
            <div className="animate-fade-in text-left">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4 text-center">Select a role to continue</p>

              <div className="flex flex-col gap-3 mb-6">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.username}
                    onClick={() => handleSelectAccount(account)}
                    className={`w-full flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 ${account.ring} rounded-xl transition-all group hover:bg-slate-800 cursor-pointer`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${account.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                      <FaUser className="text-white text-sm" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-white font-semibold text-sm group-hover:text-blue-300 transition-colors">{account.label}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{account.description}</div>
                    </div>
                    <FaChevronDown className="text-slate-600 group-hover:text-blue-400 -rotate-90 text-xs transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-700/50"></div>
                <span className="text-slate-600 text-xs">or</span>
                <div className="flex-1 h-px bg-slate-700/50"></div>
              </div>

              <button
                onClick={handleManualLogin}
                className="w-full py-3 px-4 border border-slate-700/50 hover:border-slate-600 text-slate-400 hover:text-white text-sm font-medium rounded-xl transition-all hover:bg-slate-800/50"
              >
                Enter credentials manually
              </button>
            </div>
          )}

          {/* ── STEP 2: Login Form (with back button) ── */}
          {selectedAccount && (
            <div className="animate-fade-in text-left">

              {/* Back + context header */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all flex-shrink-0"
                >
                  <FaArrowLeft className="text-xs" />
                </button>
                {selectedInfo ? (
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${selectedInfo.gradient} flex items-center justify-center shadow-md`}>
                      <FaUser className="text-white text-xs" />
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${selectedInfo.accent}`}>{selectedInfo.label}</div>
                      <div className="text-slate-500 text-xs">Credentials pre-filled</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm font-medium">Manual Login</div>
                )}
              </div>

              {isForgotPassword ? (
                <div className="text-center p-4">
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
                <form onSubmit={handleLogin} className="space-y-5">
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
                      className="w-full px-5 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
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
                      className="w-full px-5 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transform transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <><FaCircleNotch className="animate-spin text-lg" /> Authenticating...</>
                    ) : (
                      <><FaRightToBracket className="text-lg" /> Sign In</>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
