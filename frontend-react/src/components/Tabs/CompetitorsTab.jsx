import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { FaUsersViewfinder, FaCrosshairs, FaShieldHalved } from 'react-icons/fa6';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const CompetitorsTab = () => {
  const { businessData, theme } = useContext(AppContext);
  const competitors = businessData?.market_intelligence?.competitors || [];

  // Mock data for Radar chart comparison
  const radarData = {
    labels: ['Pricing', 'Feature Set', 'Integrations', 'Brand Power', 'Support'],
    datasets: [
      {
        label: 'Us (Acme Corp)',
        data: [8, 9, 7, 6, 9],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      },
      ...competitors.slice(0, 2).map((c, i) => ({
        label: c.name,
        data: i === 0 ? [5, 8, 9, 9, 6] : [9, 5, 4, 6, 7], // Mocked metrics
        backgroundColor: i === 0 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(244, 63, 94, 0.2)',
        borderColor: i === 0 ? 'rgba(59, 130, 246, 1)' : 'rgba(244, 63, 94, 1)',
        borderWidth: 2,
        borderDash: [5, 5]
      }))
    ],
  };

  const radarOptions = {
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: { display: false },
        grid: { color: theme === 'dark' ? '#334155' : '#e2e8f0' },
        angleLines: { color: theme === 'dark' ? '#334155' : '#e2e8f0' },
        pointLabels: { color: theme === 'dark' ? '#94a3b8' : '#475569', font: { size: 12, weight: 'bold' } }
      }
    },
    plugins: {
      legend: { position: 'bottom', labels: { color: theme === 'dark' ? '#94a3b8' : '#475569' } }
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FaUsersViewfinder className="text-blue-500" /> Competitor Landscape
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time tracking and strategic battle cards.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radar Chart Section */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 w-full mb-4 flex items-center gap-2">
            <FaCrosshairs className="text-rose-500" /> Capability Matrix
          </h3>
          <div className="w-full max-w-[300px] flex-1 flex items-center">
            <Radar data={radarData} options={radarOptions} />
          </div>
          <p className="text-xs text-slate-500 text-center mt-4 italic">Comparison against top 2 threats.</p>
        </div>

        {/* Battle Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {competitors.map((comp, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden group">
              {/* Decorative background shape */}
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="flex items-center gap-4 mb-5 relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl shadow-sm">
                  {comp.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">{comp.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{comp.market_share} Share</span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: comp.market_share }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">Pricing Model</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{comp.pricing}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold mb-1 flex items-center gap-1"><i className="fa-solid fa-plus"></i> Strengths</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{comp.strengths}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold mb-1 flex items-center gap-1"><i className="fa-solid fa-minus"></i> Weaknesses</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{comp.weaknesses}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
export default CompetitorsTab;
