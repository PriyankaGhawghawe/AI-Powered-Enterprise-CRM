import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { 
  FaHandshake, FaCircleCheck, FaCircleNotch, FaXmark, 
  FaPlus, FaDollarSign, FaClock, FaFire, FaTriangleExclamation,
  FaPen
} from 'react-icons/fa6';
import { SkeletonLine, SkeletonRectangle } from '../Shared/Skeleton';

const DatabaseTab = () => {
  const { businessData, setBusinessData, activeRole, token } = useContext(AppContext);
  const [draftData, setDraftData] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDealForm, setNewDealForm] = useState({ name: '', stage: 'Lead', value: 0, probability: 0, owner: '', age_days: 0 });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDealIndex, setEditingDealIndex] = useState(null);
  const [editDealForm, setEditDealForm] = useState({ name: '', stage: 'Lead', value: 0, probability: 0, owner: '', age_days: 0 });

  useEffect(() => {
    if (businessData) {
      setDraftData(JSON.parse(JSON.stringify(businessData)));
    }
  }, [businessData]);

  if (!draftData) return (
    <div className="space-y-6 fade-in p-6">
      <SkeletonLine className="h-8 w-1/3 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonRectangle className="h-32 w-full" />
        <SkeletonRectangle className="h-32 w-full" />
        <SkeletonRectangle className="h-32 w-full" />
      </div>
      <SkeletonRectangle className="h-64 w-full" />
    </div>
  );

  const deals = draftData.sales_pipeline?.deals || [];
  
  // KPI Calculations
  const activeDeals = deals.filter(d => !d.stage.includes('Closed'));
  const wonDeals = deals.filter(d => d.stage === 'Closed Won');
  
  const totalPipelineValue = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const criticalDeals = activeDeals.filter(d => d.age_days > 30 && d.value > 10000);

  const handleAddDealClick = () => {
    setNewDealForm({ name: '', stage: 'Lead', value: 0, probability: 0, owner: '', age_days: 0 });
    setShowAddModal(true);
  };

  const submitNewDeal = () => {
    setDraftData(prev => {
      const prevDeals = prev.sales_pipeline?.deals || [];
      return {
        ...prev,
        sales_pipeline: {
          ...prev.sales_pipeline,
          deals: [
            ...prevDeals,
            {
              id: `DEAL-${Math.floor(Math.random() * 10000)}`,
              name: newDealForm.name || 'New Deal',
              value: Number(newDealForm.value) || 0,
              stage: newDealForm.stage,
              probability: Number(newDealForm.probability) || 0,
              owner: newDealForm.owner || 'Unassigned',
              age_days: Number(newDealForm.age_days) || 0
            }
          ]
        }
      };
    });
    setShowAddModal(false);
  };

  const handleEditDealClick = (index) => {
    setEditingDealIndex(index);
    setEditDealForm({ ...deals[index] });
    setShowEditModal(true);
  };

  const submitEditDeal = () => {
    if (editingDealIndex === null) return;
    setDraftData(prev => {
      const prevDeals = prev.sales_pipeline?.deals || [];
      return {
        ...prev,
        sales_pipeline: {
          ...prev.sales_pipeline,
          deals: prevDeals.map((deal, i) =>
            i === editingDealIndex
              ? {
                  ...deal,
                  name: editDealForm.name || 'Deal',
                  value: Number(editDealForm.value) || 0,
                  stage: editDealForm.stage,
                  probability: Number(editDealForm.probability) || 0,
                  owner: editDealForm.owner || 'Unassigned',
                  age_days: Number(editDealForm.age_days) || 0
                }
              : deal
          )
        }
      };
    });
    setShowEditModal(false);
    setEditingDealIndex(null);
  };

  const handleRemoveDeal = (index) => {
    setDraftData(prev => ({
      ...prev,
      sales_pipeline: {
        ...prev.sales_pipeline,
        deals: (prev.sales_pipeline?.deals || []).filter((_, i) => i !== index)
      }
    }));
  };

  const hasChanges = JSON.stringify(businessData) !== JSON.stringify(draftData);

  const saveToBackend = async () => {
    if (!draftData) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const cleanedData = { ...draftData };
      
      // Send the entire updated payload back
      await axios.post('/api/data', { data: cleanedData }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBusinessData(cleanedData);
      setSaveStatus('success');
      setShowModal(false);
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleDiscard = () => {
    setDraftData(JSON.parse(JSON.stringify(businessData)));
    setSaveStatus(null);
    setShowModal(false);
  };

  const stages = ["Lead", "Demo", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

  return (
    <div className="space-y-6 animate-fade-in pb-24 p-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FaHandshake className="text-blue-500" /> Deal Records
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage active pipeline and closed deals.</p>
        </div>
        
        {/* Save/Discard Controls */}
        <div className="flex items-center gap-3">
           {hasChanges && (
             <button onClick={handleDiscard} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
               Discard
             </button>
           )}
           <button 
             onClick={() => setShowModal(true)} 
             disabled={!hasChanges || activeRole !== 'Owner'}
             className={`px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all flex items-center gap-2 ${hasChanges && activeRole === 'Owner' ? 'bg-blue-600 hover:bg-blue-500 text-white hover:-translate-y-0.5' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
           >
             {isSaving ? <FaCircleNotch className="animate-spin" /> : <FaCircleCheck />}
             Save Changes
           </button>
           
           {saveStatus === 'success' && <span className="text-sm text-emerald-500 font-medium">Saved!</span>}
           {saveStatus === 'error' && <span className="text-sm text-rose-500 font-medium">Failed</span>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-blue-500 transition-colors">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-semibold mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
               <FaDollarSign className="text-blue-500" />
            </div>
            {activeRole === 'Employee' ? 'My Active Pipeline Value' : 'Active Pipeline Value'}
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            ${totalPipelineValue.toLocaleString()}
          </div>
          <p className="text-sm text-slate-500 mt-2">{activeDeals.length} active deals</p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-emerald-500 transition-colors">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-semibold mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
               <FaCircleCheck className="text-emerald-500" />
            </div>
            {activeRole === 'Employee' ? 'My Closed Won Value' : 'Closed Won Value'}
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            ${wonValue.toLocaleString()}
          </div>
          <p className="text-sm text-emerald-500 mt-2 font-medium">{wonDeals.length} deals closed</p>
        </div>

        {activeRole !== 'Employee' && (
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-rose-500 transition-colors">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-semibold mb-2">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
                 <FaTriangleExclamation className="text-rose-500" />
              </div>
              Critical / Stalled Deals
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {criticalDeals.length}
            </div>
            <p className="text-sm text-rose-500 mt-2 font-medium">{criticalDeals.reduce((acc, d) => acc + (d.value||0), 0).toLocaleString()} at risk ({">"} 30 days)</p>
          </div>
        )}
      </div>

      {/* Main Deal List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white">All Deals</h3>
           {activeRole === 'Owner' && (
             <button onClick={handleAddDealClick} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white dark:bg-blue-600 dark:text-white rounded-lg text-sm font-semibold hover:bg-slate-700 dark:hover:bg-blue-500 transition-colors">
               <FaPlus /> New Deal
             </button>
           )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Deal Name</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Value ($)</th>
                <th className="px-6 py-4">Win Prob. (%)</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Age (Days)</th>
                {activeRole === 'Owner' && <th className="px-6 py-4 w-24 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {deals.map((deal, idx) => {
                const isCritical = deal.age_days > 30 && deal.value > 10000 && !deal.stage.includes('Closed');
                const isWon = deal.stage === 'Closed Won';
                const isLost = deal.stage === 'Closed Lost';

                return (
                <tr key={deal.id || idx} className={`group transition-colors ${isWon ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : isLost ? 'bg-slate-50 dark:bg-slate-800/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                  
                  {/* Name */}
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      {isCritical && <FaFire className="text-rose-500" title="Stalled High-Value Deal" />} {deal.name}
                    </span>
                  </td>
                  
                  {/* Stage */}
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold 
                      ${deal.stage === 'Closed Won' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                      : deal.stage === 'Closed Lost' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'}`}
                    >
                      {deal.stage}
                    </span>
                  </td>
                  
                  {/* Value */}
                  <td className="px-6 py-4">
                    <span className="font-mono text-slate-900 dark:text-slate-100">${(deal.value || 0).toLocaleString()}</span>
                  </td>

                  {/* Probability */}
                  <td className="px-6 py-4">
                    <span className="font-mono text-slate-900 dark:text-slate-100">{deal.probability || 0}%</span>
                  </td>

                  {/* Owner */}
                  <td className="px-6 py-4">
                    <span className="text-slate-900 dark:text-slate-100">{deal.owner}</span>
                  </td>

                  {/* Age */}
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-slate-500"><FaClock /> {deal.age_days}d</span>
                  </td>
                  
                  {/* Actions */}
                  {activeRole === 'Owner' && (
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEditDealClick(idx)} className="text-slate-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Edit Deal">
                          <FaPen className="text-xs" />
                        </button>
                        <button onClick={() => setDealToDelete(idx)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Delete Deal">
                          <FaXmark />
                        </button>
                      </div>
                    </td>
                  )}
                  
                </tr>
              )})}
              
              {deals.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    No deals in pipeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Saving */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden border border-slate-200 dark:border-slate-700 animate-slide-up">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Save Deal Records</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                You are about to save changes to the central pipeline. This action is irreversible.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-sans">
                Cancel
              </button>
              <button onClick={saveToBackend} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-md transition-colors flex items-center gap-2 font-sans">
                <FaCircleCheck /> Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting */}
      {dealToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setDealToDelete(null)} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden border border-slate-200 dark:border-slate-700 animate-slide-up">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Deal?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                Are you sure you want to remove this deal? You will still need to click "Save Changes" to commit this deletion to the database.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setDealToDelete(null)} className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-sans">
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleRemoveDeal(dealToDelete);
                  setDealToDelete(null);
                }} 
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg shadow-md transition-colors flex items-center gap-2 font-sans"
              >
                <FaXmark /> Delete Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-200 dark:border-slate-700 animate-slide-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create New Deal</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Enter the details for the new prospect.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Deal Name</label>
                  <input type="text" value={newDealForm.name} onChange={e => setNewDealForm({...newDealForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Acme Corp Enterprise" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Stage</label>
                  <select value={newDealForm.stage} onChange={e => setNewDealForm({...newDealForm, stage: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Owner</label>
                  <input type="text" value={newDealForm.owner} onChange={e => setNewDealForm({...newDealForm, owner: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Sales Rep" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Value ($)</label>
                  <input type="number" value={newDealForm.value} onChange={e => setNewDealForm({...newDealForm, value: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Win Prob (%)</label>
                  <input type="number" value={newDealForm.probability} onChange={e => setNewDealForm({...newDealForm, probability: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Age (Days)</label>
                  <input type="number" value={newDealForm.age_days} onChange={e => setNewDealForm({...newDealForm, age_days: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-sans">
                Cancel
              </button>
              <button onClick={submitNewDeal} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-md transition-colors flex items-center gap-2 font-sans">
                <FaPlus /> Add Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deal Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowEditModal(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-200 dark:border-slate-700 animate-slide-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Deal Details</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Modify the deal properties below.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Deal Name</label>
                  <input type="text" value={editDealForm.name} onChange={e => setEditDealForm({...editDealForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Stage</label>
                  <select value={editDealForm.stage} onChange={e => setEditDealForm({...editDealForm, stage: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Owner</label>
                  <input type="text" value={editDealForm.owner} onChange={e => setEditDealForm({...editDealForm, owner: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Value ($)</label>
                  <input type="number" value={editDealForm.value} onChange={e => setEditDealForm({...editDealForm, value: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Win Prob (%)</label>
                  <input type="number" value={editDealForm.probability} onChange={e => setEditDealForm({...editDealForm, probability: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Age (Days)</label>
                  <input type="number" value={editDealForm.age_days} onChange={e => setEditDealForm({...editDealForm, age_days: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-sans">
                Cancel
              </button>
              <button onClick={submitEditDeal} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-md transition-colors flex items-center gap-2 font-sans">
                <FaCircleCheck /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseTab;