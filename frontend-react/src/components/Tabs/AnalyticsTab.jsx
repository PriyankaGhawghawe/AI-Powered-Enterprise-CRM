import React, { useState, useMemo } from 'react';
import { FaDatabase, FaMagic, FaPlay, FaTable, FaChartBar } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Radar, PolarArea } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

export default function AnalyticsTab({ token }) {
  const [nlQuery, setNlQuery] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingExecute, setLoadingExecute] = useState(false);
  const [error, setError] = useState(null);

  const [chartType, setChartType] = useState('Bar');
  const [xAxisKey, setXAxisKey] = useState('');
  const [yAxisKey, setYAxisKey] = useState('');
  const [showChart, setShowChart] = useState(false);

  const chartData = useMemo(() => {
    if (!xAxisKey || !yAxisKey || rows.length === 0) return null;

    return {
      labels: rows.map(r => r[xAxisKey]),
      datasets: [
        {
          label: yAxisKey,
          data: rows.map(r => {
            const val = r[yAxisKey];
            return typeof val === 'number' ? val : parseFloat(val) || 0;
          }),
          backgroundColor: chartType === 'Pie' || chartType === 'Doughnut' || chartType === 'PolarArea'
            ? rows.map((_, i) => `hsl(${(i * 360) / rows.length}, 70%, 60%)`)
            : chartType === 'Radar' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.6)',
          borderColor: chartType === 'Pie' || chartType === 'Doughnut' || chartType === 'PolarArea'
            ? 'rgba(0, 0, 0, 0.1)'
            : 'rgb(99, 102, 241)',
          borderWidth: 1,
        }
      ]
    };
  }, [rows, xAxisKey, yAxisKey]);

  const handleGenerate = async () => {
    if (!nlQuery.trim()) return;
    setLoadingGenerate(true);
    setError(null);
    try {
      const res = await fetch('/api/sql/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: nlQuery })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to generate SQL');
      setSqlQuery(data.sql);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleExecute = async () => {
    if (!sqlQuery.trim()) return;
    setLoadingExecute(true);
    setError(null);
    setShowChart(false);
    try {
      const res = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sql: sqlQuery })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to execute SQL');
      setColumns(data.columns);
      setRows(data.rows);
      if (data.columns.length >= 2) {
        setXAxisKey(data.columns[0]);
        setYAxisKey(data.columns[1]);
      } else if (data.columns.length === 1) {
        setXAxisKey(data.columns[0]);
        setYAxisKey(data.columns[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingExecute(false);
    }
  };

  const [generatingViz, setGeneratingViz] = useState(false);

  const handleGenerateViz = async () => {
    if (rows.length === 0 || columns.length === 0) return;
    setGeneratingViz(true);
    setError(null);
    try {
      const res = await fetch('/api/sql/visualize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ columns, rows: rows.slice(0, 5) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to generate visualization config');

      if (data.type === 'a2ui' && data.component === 'Chart' && data.props) {
        setChartType(data.props.chartType || 'Bar');
        setXAxisKey(data.props.xAxisKey || columns[0]);
        setYAxisKey(data.props.yAxisKey || (columns.length > 1 ? columns[1] : columns[0]));
      } else {
        setChartType('Bar');
        setXAxisKey(columns[0]);
        setYAxisKey(columns.length > 1 ? columns[1] : columns[0]);
      }
      setShowChart(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingViz(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FaDatabase className="text-blue-400" /> Data Workspace
          </h2>
          <p className="text-slate-500 dark:text-gray-400 mt-1">AI-assisted SQL sandbox for data exploration.</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: NL to SQL */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FaMagic className="text-purple-400" /> Natural Language Query
          </h3>
          <textarea
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            placeholder="e.g., Show me the username and role of all users created this week..."
            className="w-full flex-grow bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[160px] resize-none mb-4 transition-all"
          />
          <button
            onClick={handleGenerate}
            disabled={loadingGenerate || !nlQuery.trim()}
            className="w-full flex justify-center items-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-slate-900 dark:text-white font-medium py-3 px-4 rounded-xl transition-colors mt-auto"
          >
            {loadingGenerate ? 'Generating...' : 'Generate SQL'} <FaMagic />
          </button>
        </div>

        {/* Right: SQL Editor */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="font-mono text-blue-400">{'</>'}</span> SQL Editor
          </h3>
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="SELECT * FROM users LIMIT 10;"
            className="flex-grow w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-green-400 font-mono text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[160px] resize-none mb-4 transition-all shadow-inner"
          />
          <button
            onClick={handleExecute}
            disabled={loadingExecute || !sqlQuery.trim()}
            className="w-full flex justify-center items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-slate-900 dark:text-white font-medium py-3 px-4 rounded-xl transition-colors mt-auto"
          >
            {loadingExecute ? 'Executing...' : 'Run Query'} <FaPlay className="text-xs" />
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FaTable className="text-emerald-400" /> Results {rows.length > 0 && <span className="text-xs font-normal text-slate-500 dark:text-gray-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">{rows.length} rows</span>}
          </h3>
        </div>
        <div className="p-0 overflow-x-auto max-h-[500px]">
          {columns.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-gray-500">
              Run a query to see results here.
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-700 dark:text-gray-300 relative">
              <thead className="text-xs text-slate-500 dark:text-gray-400 uppercase bg-slate-100 dark:bg-slate-900/80 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  {columns.map((col, idx) => {
                    // Clean up ugly SQL JSON_EXTRACT column headers
                    const cleanHeader = col.replace(/json_extract\(.*,\s*'\$\.([^']+)'\)/i, '$1').replace(/json_extract\(.*,\s*"([^"]+)"\)/i, '$1');
                    return (
                      <th key={idx} className="px-6 py-4 font-semibold whitespace-nowrap tracking-wider">
                        {cleanHeader}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    {columns.map((col, colIdx) => {
                      const val = row[col];
                      const isNull = val === null || val === undefined;
                      return (
                        <td key={colIdx} className="px-6 py-4">
                          <div className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap hover:whitespace-normal hover:break-words">
                            {isNull ? (
                              <span className="text-xs italic text-slate-400 dark:text-gray-500 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md">NULL</span>
                            ) : typeof val === 'object' ? (
                              <span className="font-mono text-xs text-amber-300">{JSON.stringify(val)}</span>
                            ) : (
                              <span className={typeof val === 'number' ? 'text-blue-300 font-mono text-right block' : ''}>{String(val)}</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Visualizations */}
      {rows.length > 0 && columns.length > 0 && (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl mt-6 p-6">
          {!showChart ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Analyze Your Data</h3>
              <p className="text-slate-400 mb-6 max-w-md">
                We've fetched your results. Would you like to generate an AI-optimized visualization for this data?
              </p>
              <button
                onClick={handleGenerateViz}
                disabled={generatingViz}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
              >
                {generatingViz ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FaChartBar /> Generate Visualization
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <FaChartBar className="text-indigo-400" /> AI-Generated {chartType} Chart
                </h3>
              </div>

              <div className="w-full h-[400px] flex items-center justify-center bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-white/5 p-4">
                {chartData ? (
                  chartType === 'Bar' ? (
                    <Bar
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top', labels: { color: 'white' } }, title: { display: false } },
                        scales: {
                          x: { ticks: { color: 'gray' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                          y: { ticks: { color: 'gray' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                        }
                      }}
                    />
                  ) : chartType === 'Line' ? (
                    <Line
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top', labels: { color: 'white' } }, title: { display: false } },
                        scales: {
                          x: { ticks: { color: 'gray' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                          y: { ticks: { color: 'gray' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                        }
                      }}
                    />
                  ) : chartType === 'Pie' ? (
                    <div className="w-[300px] h-[300px]">
                      <Pie
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'right', labels: { color: 'white' } }, title: { display: false } }
                        }}
                      />
                    </div>
                  ) : chartType === 'Radar' ? (
                    <div className="w-[400px] h-[400px]">
                      <Radar
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'top', labels: { color: 'white' } }, title: { display: false } },
                          scales: { r: { ticks: { color: 'gray', backdropColor: 'transparent' }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: 'white' } } }
                        }}
                      />
                    </div>
                  ) : chartType === 'PolarArea' ? (
                    <div className="w-[350px] h-[350px]">
                      <PolarArea
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'right', labels: { color: 'white' } }, title: { display: false } },
                          scales: { r: { ticks: { color: 'gray', backdropColor: 'transparent' }, grid: { color: 'rgba(255,255,255,0.1)' } } }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-[300px] h-[300px]">
                      <Doughnut
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'right', labels: { color: 'white' } }, title: { display: false } }
                        }}
                      />
                    </div>
                  )
                ) : (
                  <p className="text-slate-400 dark:text-gray-500">Not enough data to render chart.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
