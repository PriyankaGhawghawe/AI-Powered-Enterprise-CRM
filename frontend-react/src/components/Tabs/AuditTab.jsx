import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { FaFingerprint } from 'react-icons/fa6';
import { AppContext } from '../../context/AppContext';

const AuditTab = () => {
  const { token } = useContext(AppContext);
  const [logs, setLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      if (!token) return;
      try {
        const res = await axios.get('/api/audit', { headers: { Authorization: `Bearer ${token}` }});
        setLogs(res.data);
      } catch (e) {
        console.error("Error loading audit logs", e);
      }
    };
    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter(log => {
    if (statusFilter && log.status !== statusFilter) return false;
    if (actionFilter && log.action !== actionFilter) return false;
    return true;
  });

  const handleDownloadCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Target Resource', 'Status'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.user,
      log.action,
      log.target,
      log.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'audit_logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FaFingerprint className="text-slate-500" /> Platform Security Audit Logs
          </h2>
          <div className="flex flex-col md:flex-row justify-between md:items-center mt-2 gap-4">
            <p className="text-slate-500 dark:text-slate-400">Immutable history of accesses, actions, and security gate decisions.</p>
            <div className="flex items-center gap-3">
              <select 
                value={actionFilter} 
                onChange={e => setActionFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {[...new Set(logs.map(l => l.action))].map(act => <option key={act} value={act}>{act}</option>)}
              </select>

              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Success">Success / Allowed</option>
                <option value="Denied">Denied / Failed</option>
              </select>

              <button onClick={handleDownloadCSV} className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
                Export CSV
              </button>
            </div>
          </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timestamp</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Resource</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredLogs.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-slate-900 dark:text-white font-medium">{log.user}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{log.action}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{log.target}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.status === 'Success' || log.status === 'Allowed'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-sm text-slate-500">No logs found.</td>
                      </tr>
                    )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};
export default AuditTab;
