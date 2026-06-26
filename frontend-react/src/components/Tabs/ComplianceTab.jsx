import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { FaCircleCheck, FaClock, FaCircleNotch, FaTriangleExclamation, FaFileShield, FaDownload, FaArrowRight, FaRobot } from 'react-icons/fa6';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const ComplianceTab = () => {
  const { businessData, theme, setGlobalChatPrompt } = useContext(AppContext);
  const [localChecklist, setLocalChecklist] = useState([]);
  const [localRisks, setLocalRisks] = useState([]);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (businessData?.compliance?.checklist) {
      setLocalChecklist(JSON.parse(JSON.stringify(businessData.compliance.checklist)));
    }
    if (businessData?.compliance?.regulatory_risks) {
      // Add a 'mitigated' flag to track local UI state
      const risksWithStatus = businessData.compliance.regulatory_risks.map(r => ({ ...r, mitigated: false }));
      setLocalRisks(risksWithStatus);
    }
  }, [businessData]);

  const toggleStatus = (idx) => {
    const nextStatus = {
      'Not Started': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Not Started'
    };
    const newList = [...localChecklist];
    newList[idx].status = nextStatus[newList[idx].status] || 'Not Started';
    setLocalChecklist(newList);
  };

  const handleMitigation = (index, riskArea) => {
    const newRisks = [...localRisks];
    newRisks[index].mitigated = true;
    setLocalRisks(newRisks);
    
    setToastMsg(`Ticket Created: Mitigation protocol initiated for ${riskArea}`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const completedCount = localChecklist.filter(c => c.status === "Completed").length;
  const score = localChecklist.length ? Math.round((completedCount / localChecklist.length) * 100) : 0;
  
  const getIcon = (status) => {
    if (status === "Completed") return <FaCircleCheck className="text-emerald-500" />;
    if (status === "In Progress") return <FaCircleNotch className="text-blue-500 animate-spin" />;
    return <FaClock className="text-slate-400" />;
  };

  const gaugeData = {
    datasets: [{
      data: [score, 100 - score],
      backgroundColor: [
        score >= 80 ? 'rgba(16, 185, 129, 0.8)' : score >= 50 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(244, 63, 94, 0.8)', 
        theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
      ],
      borderWidth: 0,
      circumference: 180,
      rotation: 270,
    }]
  };

  return (
    <div className="animate-fade-in relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 animate-fade-in-up bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <FaCircleCheck /> {toastMsg}
        </div>
      )}

      <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Regulatory Compliance</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Automated policy enforcement and risk tracking.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Gauge Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center relative">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 w-full absolute top-6 left-6">Compliance Score</h3>
            <div className="w-full max-w-[250px] relative mt-10">
              <Doughnut 
                data={gaugeData} 
                options={{ cutout: '80%', plugins: { tooltip: { enabled: false }, legend: { display: false } } }} 
              />
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center mb-4">
                <span className="text-4xl font-bold text-slate-800 dark:text-white">{score}%</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{businessData?.compliance?.gdpr_status}</span>
              </div>
            </div>
        </div>

        {/* Regulatory Risks */}
        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FaTriangleExclamation className="text-rose-500" /> Regulatory Risk Queue
              </h3>
              <button 
                onClick={() => setGlobalChatPrompt("Summarize the current regulatory risks and provide recommendations for immediate action.")}
                className="text-xs px-2.5 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg flex items-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-800"
              >
                <FaRobot /> Ask AI
              </button>
            </div>
            {localRisks.map((risk, i) => (
              <div key={i} className={`mb-4 last:mb-0 p-4 rounded-lg border transition-all duration-500 ${
                risk.mitigated 
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30' 
                  : 'bg-white border-rose-100 dark:bg-slate-800/50 dark:border-rose-800/50'
              }`}>
                <h4 className={`font-semibold flex justify-between items-center ${risk.mitigated ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {risk.risk_area} 
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    risk.mitigated 
                      ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-200 text-rose-800 dark:bg-rose-800 dark:text-rose-200'
                  }`}>
                    {risk.mitigated ? 'In Progress' : risk.severity}
                  </span>
                </h4>
                <p className={`text-sm mt-2 ${risk.mitigated ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}`}>
                  {risk.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  {risk.mitigated ? (
                     <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                       <FaCircleNotch className="animate-spin" /> Ticket Assigned to Legal Team
                     </p>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">Mitigation: {risk.mitigation}</p>
                      <button 
                        onClick={() => handleMitigation(i, risk.risk_area)}
                        className="text-xs font-bold flex items-center gap-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                      >
                        Take Action <FaArrowRight />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {localRisks.length === 0 && <p className="text-sm text-slate-500">No active risks detected.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Checklist */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Interactive Compliance Checklist</h3>
          <p className="text-sm text-slate-500 mb-4">Click any item to toggle its status and update the score.</p>
          <div className="space-y-3">
            {localChecklist.map((item, i) => (
              <button 
                key={i} 
                onClick={() => toggleStatus(i)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  {getIcon(item.status)}
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.item}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full transition-colors ${
                  item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  item.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {item.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Document Vault */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
           <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><FaFileShield className="text-indigo-500" /> Document Vault</h3>
           <div className="space-y-4">
              <button onClick={() => setToastMsg('Downloading SOC2_Type2_Report.pdf...')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group">
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">SOC2 Type II Report</span>
                  <span className="text-xs text-slate-500">Updated: Oct 14, 2023</span>
                </div>
                <FaDownload className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </button>
              
              <button onClick={() => setToastMsg('Downloading GDPR_Data_Audit.pdf...')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group">
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">GDPR Data Audit</span>
                  <span className="text-xs text-slate-500">Updated: Jan 02, 2024</span>
                </div>
                <FaDownload className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </button>

              <button onClick={() => setToastMsg('Downloading ISO27001_Cert.pdf...')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group">
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">ISO 27001 Certificate</span>
                  <span className="text-xs text-slate-500">Updated: Mar 15, 2024</span>
                </div>
                <FaDownload className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
export default ComplianceTab;
