import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import {
  FaBrain, FaChartPie, FaBinoculars, FaShieldHalved,
  FaHandshake, FaListCheck, FaPlug, FaUsers, FaChessKnight,
  FaHouse, FaMoon, FaSun, FaUserShield, FaArrowRightFromBracket
} from 'react-icons/fa6';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { activeRole, username, theme, toggleTheme, logout } = useContext(AppContext);

  const tabs = [
    { id: 'tab-home', label: 'Home', icon: <FaHouse /> },
    { id: 'tab-briefings', label: 'Briefings', icon: <FaBrain /> },
    { id: 'tab-warroom', label: 'War Room', icon: <FaChessKnight /> },
    { id: 'tab-analytics', label: 'Analytics', icon: <FaChartPie /> },
    { id: 'tab-competitors', label: 'Competitors', icon: <FaBinoculars /> },
    { id: 'tab-compliance', label: 'Compliance', icon: <FaShieldHalved /> },
    { id: 'tab-database', label: 'Deal Records', icon: <FaHandshake /> },
    { id: 'tab-audit', label: 'Audit Log', icon: <FaListCheck /> },
    { id: 'tab-integrations', label: 'Integrations', icon: <FaPlug /> },
    { id: 'tab-users', label: 'Users', icon: <FaUsers /> }
  ];

  return (
    <div className="w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 text-slate-300 h-screen flex flex-col flex-shrink-0 transition-all duration-300 relative z-20 shadow-xl">
      {/* Brand & User Info */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FaChartPie className="text-white text-sm" />
          </div>
          Business OS
        </h1>
        <div className="tour-step-role flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
            <FaUserShield />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{username || 'Admin User'}</p>
            <p className="text-xs text-slate-400 truncate">{activeRole}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="tour-step-navigation flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Navigation</p>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          // Role-based visibility check for Employees (cannot see Users, Integrations, Audit Log, War Room)
          if (activeRole === 'Employee') {
            if (['tab-users', 'tab-integrations', 'tab-audit', 'tab-warroom'].includes(tab.id)) {
              return null;
            }
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${isActive
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 hover:text-white'
                }`}
            >
              <span className={`text-lg ${isActive ? 'text-white' : 'text-slate-500'}`}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          {theme === 'dark' ? <><FaSun className="text-yellow-400" /> Light Mode</> : <><FaMoon className="text-blue-400" /> Dark Mode</>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
