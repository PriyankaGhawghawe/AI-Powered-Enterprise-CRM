import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { FaStripe, FaSalesforce, FaJira, FaSlack, FaHubspot, FaRotateRight, FaPlug } from 'react-icons/fa6';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const staticIntegrationsData = {
  Stripe: {
    category: 'Billing & Payments',
    icon: <FaStripe className="text-5xl text-[#635BFF]" />,
    color: 'hover:border-[#635BFF]/50'
  },
  Salesforce: {
    category: 'CRM',
    icon: <FaSalesforce className="text-5xl text-[#00A1E0]" />,
    color: 'hover:border-[#00A1E0]/50'
  },
  HubSpot: {
    category: 'Marketing Automation',
    icon: <FaHubspot className="text-5xl text-[#FF7A59]" />,
    color: 'hover:border-[#FF7A59]/50'
  },
  Slack: {
    category: 'Communications',
    icon: <FaSlack className="text-5xl text-[#E01E5A]" />,
    color: 'hover:border-[#E01E5A]/50'
  },
  Jira: {
    category: 'Issue Tracking',
    icon: <FaJira className="text-5xl text-[#0052CC]" />,
    color: 'hover:border-[#0052CC]/50'
  }
};

const IntegrationsTab = () => {
  const { addToast, token } = useContext(AppContext);
  const [integrations, setIntegrations] = useState([]);
  const [syncingStates, setSyncingStates] = useState({});
  const [configuringStates, setConfiguringStates] = useState({});
  const [modalIntegration, setModalIntegration] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const [mcpSyncingIntegration, setMcpSyncingIntegration] = useState(null);
  const [mcpLogs, setMcpLogs] = useState([]);

  const fetchIntegrations = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/integrations', { headers: { Authorization: `Bearer ${token}` }});
      const formatted = res.data.map(i => ({
        ...i,
        ...staticIntegrationsData[i.name]
      }));
      setIntegrations(formatted);
    } catch (err) {
      console.error(err);
      addToast('Failed to load integrations', 'error');
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [token]);

  const handleMCPSync = async (name) => {
    setMcpSyncingIntegration(name);
    setMcpLogs([`[System] Connecting to MCP Server for ${name}...`]);
    setSyncingStates(prev => ({ ...prev, [name]: true }));
    
    try {
      const response = await fetch(`/api/integrations/sync/${name}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Sync failed');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        
        const events = chunkValue.split('\n\n');
        for (const event of events) {
          if (event.startsWith('data: ')) {
            const dataStr = event.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              setMcpLogs(prev => [...prev, `[System] Connection closed.`]);
              setTimeout(() => {
                 setMcpSyncingIntegration(null);
                 addToast(`Successfully synced data from ${name}`, 'success');
                 fetchIntegrations();
              }, 1500);
              break;
            }
            if (dataStr) {
               try {
                 const parsed = JSON.parse(dataStr);
                 setMcpLogs(prev => [...prev, parsed.log]);
               } catch (e) {
                 console.error(e);
               }
            }
          }
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to sync', 'error');
      setMcpSyncingIntegration(null);
    } finally {
      setSyncingStates(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleConfigureSubmit = async (e) => {
    e.preventDefault();
    if (!modalIntegration) return;
    const name = modalIntegration.name;
    setConfiguringStates(prev => ({ ...prev, [name]: true }));
    setModalIntegration(null);
    
    try {
      await axios.post(`/api/integrations/${name}/configure`, { api_key: apiKeyInput }, { headers: { Authorization: `Bearer ${token}` }});
      addToast(`Successfully connected to ${name}`, 'success');
      fetchIntegrations();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to configure', 'error');
    } finally {
      setConfiguringStates(prev => ({ ...prev, [name]: false }));
      setApiKeyInput('');
    }
  };

  const handleDisconnect = async (name) => {
    if (!window.confirm(`Are you sure you want to disconnect ${name}?`)) return;
    try {
      await axios.delete(`/api/integrations/${name}`, { headers: { Authorization: `Bearer ${token}` }});
      addToast(`Disconnected ${name}`, 'success');
      fetchIntegrations();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to disconnect', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
              <FaPlug />
            </div>
            Integrations Hub
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage connections and sync data from your 3rd-party enterprise tools.</p>
        </div>
        <button 
          onClick={() => integrations.forEach(i => i.status === 'connected' && handleMCPSync(i.name))}
          className="px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          <FaRotateRight /> Sync All Active
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => {
          const isSyncing = syncingStates[integration.name];
          const isConfiguring = configuringStates[integration.name];
          return (
            <div key={integration.id} className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-all duration-300 ${integration.color} group relative overflow-hidden`}>
              {/* Status Badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                {integration.status === 'connected' && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Connected
                  </span>
                )}
                {integration.status === 'disconnected' && (
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700">
                    Disconnected
                  </span>
                )}
                {integration.status === 'action_required' && (
                  <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-full border border-rose-200 dark:border-rose-800">
                    <FaExclamationCircle className="inline mr-1" /> Action Required
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center text-center mt-6">
                <div className="h-16 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  {integration.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-4">{integration.name}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{integration.category}</p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Last Sync</span>
                  <span className={`text-sm font-medium ${integration.error ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {integration.last_synced_at ? new Date(integration.last_synced_at).toLocaleString() : 'Never'}
                  </span>
                </div>
                
                {integration.status === 'connected' ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleMCPSync(integration.name)}
                      disabled={isSyncing}
                      className="flex-1 py-2.5 px-4 bg-slate-900 dark:bg-slate-700/80 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                    >
                      {isSyncing ? (
                        <><FaRotateRight className="animate-spin" /> Syncing via MCP...</>
                      ) : (
                        <><FaRotateRight /> Live MCP Sync</>
                      )}
                    </button>
                    <button 
                      onClick={() => handleDisconnect(integration.name)}
                      className="py-2.5 px-4 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold rounded-xl transition-colors"
                      title="Disconnect"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setModalIntegration(integration)}
                    disabled={isConfiguring}
                    className="w-full py-2.5 px-4 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {isConfiguring ? (
                      <><FaRotateRight className="animate-spin text-indigo-500" /> Authorizing...</>
                    ) : (
                      <>Configure Connection</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Configuration */}
      {modalIntegration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              Configure {modalIntegration.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Please enter your API Key or Webhook URL to securely connect your {modalIntegration.name} account to the Business OS.
            </p>
            <form onSubmit={handleConfigureSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">API Key / Token</label>
                <input 
                  type="password"
                  required
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="sk_test_..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setModalIntegration(null)}
                  className="px-5 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={configuringStates[modalIntegration.name]}
                  className="px-5 py-2 font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-70"
                >
                  {configuringStates[modalIntegration.name] ? 'Saving...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MCP Sync Terminal Modal */}
      {mcpSyncingIntegration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e1e] rounded-xl w-full max-w-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
            <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-slate-700">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-slate-400 font-mono ml-2">mcp-sync-terminal : {mcpSyncingIntegration}</span>
            </div>
            <div className="p-4 h-64 overflow-y-auto font-mono text-sm text-green-400">
              {mcpLogs.map((log, i) => (
                <div key={i} className="mb-1 animate-fade-in">&gt; {log}</div>
              ))}
              <div className="animate-pulse">&gt; _</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsTab;
