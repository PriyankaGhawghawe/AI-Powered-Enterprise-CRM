import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { FaMoneyBillTrendUp, FaChartLine, FaShieldHalved, FaBolt, FaPlus, FaRotateRight, FaNewspaper, FaArrowRight, FaClockRotateLeft, FaHandshake } from 'react-icons/fa6';
import { SkeletonLine, SkeletonRectangle } from '../Shared/Skeleton';

const Sparkline = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = 80 / (data.length - 1);
  const points = data.map((d, i) => `${i * step},${24 - ((d - min) / range) * 24}`).join(' ');
  return (
    <svg viewBox="0 0 80 24" className="w-16 h-6 ml-auto" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const FinancialChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  // We'll build a simple bar chart using div heights
  const maxRevenue = Math.max(...data.map(d => d.revenue));

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col col-span-1 lg:col-span-2">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Revenue vs. Expenses</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Last 6 Months Historical Performance</p>
        </div>
        <FaChartLine className="text-blue-500 text-xl" />
      </div>

      <div className="flex-1 flex items-end justify-between gap-2 h-48 mt-auto pt-4 border-b border-slate-100 dark:border-slate-700">
        {data.slice(-6).map((monthData, idx) => {
          const revHeight = Math.max(10, (monthData.revenue / maxRevenue) * 100);
          const expHeight = Math.max(10, (monthData.expenses / maxRevenue) * 100);
          return (
            <div key={idx} className="flex flex-col justify-end items-center w-full h-full group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 dark:bg-slate-700 text-white text-xs p-2 rounded whitespace-nowrap z-10 shadow-lg">
                Rev: ${monthData.revenue.toLocaleString()}<br />
                Exp: ${monthData.expenses.toLocaleString()}
              </div>

              <div className="flex gap-1 w-full justify-center items-end h-full">
                <div
                  className="bg-emerald-500 hover:bg-emerald-400 rounded-t-sm w-full max-w-[20px] transition-all duration-300"
                  style={{ height: `${revHeight}%` }}
                ></div>
                <div
                  className="bg-rose-500 hover:bg-rose-400 rounded-t-sm w-full max-w-[20px] transition-all duration-300"
                  style={{ height: `${expHeight}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">{monthData.month.substring(0, 3)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Revenue</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-500 rounded-sm"></div> Expenses</div>
      </div>
    </div>
  );
};

const ActivityFeed = () => {
  const { token } = useContext(AppContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!token) return;
      try {
        const res = await axios.get('/api/audit', { headers: { Authorization: `Bearer ${token}` } });
        setLogs(res.data.slice(0, 5)); // Get latest 5
      } catch (e) {
        console.error("Error loading audit logs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm col-span-1">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <FaClockRotateLeft className="text-slate-400" /> Recent Activity
        </h3>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonLine className="h-10 w-full" />
          <SkeletonLine className="h-10 w-full" />
          <SkeletonLine className="h-10 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${log.status === 'ALLOWED' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{log.action}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">By {log.user_role || log.role} • {log.timestamp.split('T')[0]}</p>
              </div>
            </div>
          ))}
          {logs.length === 0 && <p className="text-sm text-slate-500 italic text-center py-4">No recent activity.</p>}
        </div>
      )}
    </div>
  );
};

const QuickActions = ({ setActiveTab }) => {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm col-span-1 lg:col-span-2">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <FaBolt className="text-yellow-500" /> Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => setActiveTab('tab-database')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all group">
          <FaHandshake className="text-2xl text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
          <span className="font-semibold text-sm">Deal Records</span>
        </button>
        <button onClick={() => setActiveTab('tab-integrations')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group">
          <FaRotateRight className="text-xl text-slate-400 group-hover:text-emerald-500" />
          <span className="text-xs font-semibold">Sync Data</span>
        </button>
        <button onClick={() => setActiveTab('tab-compliance')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all group">
          <FaShieldHalved className="text-xl text-slate-400 group-hover:text-purple-500" />
          <span className="text-xs font-semibold">Run Scan</span>
        </button>
        <button onClick={() => setActiveTab('tab-briefings')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all group">
          <FaNewspaper className="text-xl text-slate-400 group-hover:text-rose-500" />
          <span className="text-xs font-semibold">Briefing</span>
        </button>
      </div>
    </div>
  );
};

const CompetitorAlert = ({ setActiveTab }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-5 shadow-md col-span-1 text-white relative overflow-hidden flex flex-col justify-between">
      <div className="absolute -right-4 -top-4 opacity-10 transform rotate-12">
        <FaNewspaper className="text-9xl" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3 opacity-90">
          <span className="px-2 py-1 bg-white/20 rounded text-xs font-bold uppercase tracking-wider">Intel Alert</span>
        </div>
        <h3 className="text-lg font-bold mb-2">Acme Corp announces new AI feature</h3>
        <p className="text-sm opacity-90 line-clamp-3">Competitor Acme Corp just released a press statement detailing their new Q3 product roadmap, heavily featuring predictive analytics...</p>
      </div>
      <button onClick={() => setActiveTab('tab-competitors')} className="relative z-10 mt-4 flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all w-fit bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg">
        Read Full Analysis <FaArrowRight />
      </button>
    </div>
  );
};

const HomeTab = ({ setActiveTab }) => {
  const { businessData, activeRole } = useContext(AppContext);

  if (!businessData) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="mb-6">
          <SkeletonLine className="h-8 w-1/3 mb-2" />
          <SkeletonLine className="h-4 w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonRectangle className="h-32 w-full" />
          <SkeletonRectangle className="h-32 w-full" />
          <SkeletonRectangle className="h-32 w-full" />
          <SkeletonRectangle className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back, {activeRole}</h2>
        <p className="text-slate-500 dark:text-slate-400">Here's a high-level overview of the company's performance today.</p>
      </div>

      {/* Top KPIs */}
      <div className="tour-step-kpis grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cash Balance</p>
            <FaMoneyBillTrendUp className="text-emerald-500" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">${(businessData.financials?.cash_balance ?? 0).toLocaleString()}</p>
            <div className="opacity-70 group-hover:opacity-100 transition-opacity">
              <Sparkline data={(businessData.financials?.historical_performance ?? []).map(h => (h.revenue ?? 0) - (h.expenses ?? 0) + 350000)} color="#10b981" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Runway</p>
            <FaChartLine className="text-slate-400" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {(() => {
                const expensesObj = businessData.financials?.expenses ?? {};
                const expenses = Object.values(expensesObj).reduce((a, b) => a + b, 0);
                const burn = expenses - (businessData.financials?.monthly_mrr ?? 0);
                return burn <= 0 ? "Infinite" : `${((businessData.financials?.cash_balance ?? 0) / burn).toFixed(1)}m`;
              })()}
            </p>
            <div className="opacity-70 group-hover:opacity-100 transition-opacity">
              <Sparkline data={[14, 13.5, 13.8, 14.1, 14.0]} color="#64748b" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Pipeline</p>
            <FaChartLine className="text-blue-500" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              ${(businessData.sales_pipeline?.deals ?? []).filter(d => !d.stage?.includes('Closed')).reduce((a, b) => a + (b.value ?? 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compliance</p>
            <FaShieldHalved className="text-purple-500" />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {(() => {
                const list = businessData.compliance?.checklist ?? [];
                if (list.length === 0) return "0%";
                return `${Math.round((list.filter(c => c.status === "Completed").length / list.length) * 100)}%`;
              })()}
            </p>
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-1000"
                style={{
                  width: (() => {
                    const list = businessData.compliance?.checklist ?? [];
                    if (list.length === 0) return "0%";
                    return `${Math.round((list.filter(c => c.status === "Completed").length / list.length) * 100)}%`;
                  })()
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FinancialChart data={businessData.financials.historical_performance} />
        <ActivityFeed />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActions setActiveTab={setActiveTab} />
        <CompetitorAlert setActiveTab={setActiveTab} />
      </div>

    </div>
  );
};

export default HomeTab;
