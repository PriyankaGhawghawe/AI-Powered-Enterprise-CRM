import React, { useState, useEffect, useContext, Suspense } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { useQuery } from '@tanstack/react-query';
import ErrorBoundary from '../components/ErrorBoundary';

const AnalyticsTab = React.lazy(() => import('../components/Tabs/AnalyticsTab'));
const BriefingsTab = React.lazy(() => import('../components/Tabs/BriefingsTab'));
const CompetitorsTab = React.lazy(() => import('../components/Tabs/CompetitorsTab'));
const ComplianceTab = React.lazy(() => import('../components/Tabs/ComplianceTab'));
const DatabaseTab = React.lazy(() => import('../components/Tabs/DatabaseTab'));
const AuditTab = React.lazy(() => import('../components/Tabs/AuditTab'));
const IntegrationsTab = React.lazy(() => import('../components/Tabs/IntegrationsTab'));
const WarRoomTab = React.lazy(() => import('../components/Tabs/WarRoomTab'));
import UsersTab from '../components/Tabs/UsersTab';
const HomeTab = React.lazy(() => import('../components/Tabs/HomeTab'));
import ChatWidget from '../components/Chat/ChatWidget';
import TourWidget from '../components/TourWidget';
import ToastContainer from '../components/Shared/ToastContainer';
import Sidebar from '../components/Shared/Sidebar';
import { FaFilePdf, FaMoon, FaSun, FaCircleNotch } from 'react-icons/fa6';
import { pdf } from '@react-pdf/renderer';
import ExecutiveReportPDF from '../components/ExecutiveReportPDF';
import { saveAs } from 'file-saver';

const Dashboard = () => {
  const { activeRole, username, theme, toggleTheme, businessData, setBusinessData, logout, token } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('tab-home');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      await new Promise(r => setTimeout(r, 100));
      
      const doc = <ExecutiveReportPDF businessData={businessData} activeRole={activeRole} theme={theme} />;
      const asPdf = pdf([]);
      asPdf.updateContainer(doc);
      
      const blob = await asPdf.toBlob();
      saveAs(blob, `BusinessOS_Master_Report.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsExporting(false);
    }
  };

  const { data: queryData, isLoading, isError, error } = useQuery({
    queryKey: ['businessData', token],
    queryFn: async () => {
      const res = await axios.get('/api/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token
  });

  useEffect(() => {
    if (queryData) {
      setBusinessData(queryData);
      setIsDataLoaded(true);
    }
  }, [queryData, setBusinessData]);

  // Role-based visibility check
  const isVisible = (requiredRole) => {
    if (!requiredRole) return true;
    if (activeRole === 'Owner') return true;
    if (activeRole === 'Manager' && requiredRole !== 'Owner') return true;
    if (activeRole === 'Employee' && requiredRole === 'Employee') return true;
    return false;
  };

  const HIDDEN_TABS_ROLE = {
    Manager:  ['tab-users'],
    Employee: ['tab-users', 'tab-integrations', 'tab-audit', 'tab-warroom'],
  };

  const renderTabContent = () => {
    if (!isDataLoaded) {
      return (
        <div className="animate-pulse bg-slate-200 dark:bg-slate-800 h-[400px] rounded-2xl w-full border border-slate-300 dark:border-slate-700 shadow-sm"></div>
      );
    }
    
    // Guard: if this role shouldn't see this tab, silently fall back to Home
    const hiddenTabs = HIDDEN_TABS_ROLE[activeRole] || [];
    if (hiddenTabs.includes(activeTab)) {
      return <HomeTab setActiveTab={setActiveTab} />;
    }

    switch (activeTab) {
      case 'tab-home': return <HomeTab setActiveTab={setActiveTab} />;
      case 'tab-analytics': return <AnalyticsTab token={token} />;
      case 'tab-briefings': return <BriefingsTab />;
      case 'tab-competitors': return <CompetitorsTab />;
      case 'tab-compliance': return <ComplianceTab />;
      case 'tab-integrations': return <IntegrationsTab />;
      case 'tab-database': return <DatabaseTab />;
      case 'tab-warroom': return <WarRoomTab />;
      case 'tab-audit': return <AuditTab />;
      case 'tab-users': return <UsersTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <div className={`h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="flex-shrink-0 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between px-6 py-4 z-30">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-200">
              {activeTab === 'tab-home' ? 'Overview' : 
               activeTab === 'tab-briefings' ? 'Executive Reports' :
               activeTab === 'tab-warroom' ? 'The War Room' :
               activeTab.replace('tab-', '').charAt(0).toUpperCase() + activeTab.replace('tab-', '').slice(1)}
            </span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:block">
                    System Active
                  </span>
              </div>

              {/* Notification Bell */}
              <div className="relative group">
                <button className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors relative">
                  <i className="fa-solid fa-bell text-lg"></i>
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </button>
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 font-semibold text-sm">Notifications</div>
                  <div className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center italic">No new alerts.</div>
                </div>
              </div>
              
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="tour-step-pdf flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all text-sm font-semibold disabled:opacity-70 disabled:cursor-wait"
              >
                {isExporting ? <FaCircleNotch className="animate-spin" /> : <FaFilePdf />} 
                <span className="hidden sm:inline">{isExporting ? 'Generating...' : 'Export PDF'}</span>
              </button>

              <button 
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md transition-all text-sm font-semibold"
              >
                <span>Sign Out</span>
              </button>
          </div>
        </header>

        {/* Main Stage */}
        <main id="pdf-content-area" className="flex-1 p-6 md:p-8 overflow-y-auto w-full relative z-10">
          <ErrorBoundary>
            <Suspense fallback={<div className="animate-pulse bg-slate-200 dark:bg-slate-800 h-[400px] rounded-2xl w-full border border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 font-medium">Loading module...</div>}>
              {renderTabContent()}
            </Suspense>
          </ErrorBoundary>
        </main>

        <ToastContainer />
        <ChatWidget />
        <TourWidget />
      </div>
    </div>
  );
};

export default Dashboard;
