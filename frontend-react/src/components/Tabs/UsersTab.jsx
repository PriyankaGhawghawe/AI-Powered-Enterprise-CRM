import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { FaUserPlus, FaTrash, FaUserShield, FaUserGear, FaUserAstronaut, FaSpinner, FaChevronDown, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa6';
import { SkeletonLine } from '../Shared/Skeleton';
import { AppContext } from '../../context/AppContext';

const UsersTab = () => {
  const { token } = useContext(AppContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRoleId, setEditingRoleId] = useState(null);
  
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState(generatePassword());
  const [newRole, setNewRole] = useState('Employee');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isCompact, setIsCompact] = useState(false);
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(false);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` }});
      setUsers(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load users. Ensure you have Owner access.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    
    setIsSubmitting(true);
    setSuccessMsg(null);
    setError(null);
    
    try {
      await axios.post('/api/users', {
        username: newUsername,
        password: newPassword,
        role: newRole
      }, { headers: { Authorization: `Bearer ${token}` }});
      setSuccessMsg(`User ${newUsername} created successfully. Please copy the password and provide it to them securely.`);
      setNewUsername('');
      setNewPassword(generatePassword());
      setNewRole('Employee');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user ${username}?`)) return;
    
    try {
      await axios.delete(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` }});
      setSuccessMsg(`User ${username} deleted.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleResetPassword = async (id, username) => {
    if (!window.confirm(`Are you sure you want to forcefully reset the password for ${username}?`)) return;
    
    const tempPassword = generatePassword();
    try {
      await axios.post(`/api/users/${id}/reset-password`, { new_password: tempPassword }, { headers: { Authorization: `Bearer ${token}` }});
      setSuccessMsg(`Password for ${username} reset successfully. New temporary password: ${tempPassword}. Please copy and provide it to them securely.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      // Don't auto-clear success message here so the admin has time to copy the password
    }
  };

  const handleRoleChange = async (id, newRole, username) => {
    try {
      await axios.put(`/api/users/${id}/role`, { role: newRole }, { headers: { Authorization: `Bearer ${token}` }});
      setSuccessMsg(`Role for ${username} updated to ${newRole}.`);
      setEditingRoleId(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update role.');
    } finally {
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'Owner': return <FaUserShield className="text-purple-500" />;
      case 'Manager': return <FaUserGear className="text-blue-500" />;
      default: return <FaUserAstronaut className="text-green-500" />;
    }
  };

  let displayedUsers = [...users];
  if (sortField) {
    displayedUsers.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  if (searchQuery) {
    displayedUsers = displayedUsers.filter(u => 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">User Management</h2>
          <p className="text-slate-500 dark:text-slate-400">Control system access and assign roles</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl">
          {error}
        </div>
      )}
      
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 p-4 rounded-xl">
          {successMsg}
        </div>
      )}

      {/* Create User Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">Create New User</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          A secure password has been auto-generated. Please copy and provide it to the new user. They will be forced to change it on their first login.
        </p>
        <form onSubmit={handleCreateUser} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Username</label>
            <input 
              type="text" 
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. john.doe"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Password</label>
            <div className="relative inline-block w-full">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Role</label>
            <div className="relative inline-block w-full">
              <select 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option value="Employee">Employee (Limited)</option>
                <option value="Manager">Manager (Operational)</option>
                <option value="Owner">Owner (Full Admin)</option>
              </select>
              <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaUserPlus />}
            <span>Create</span>
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Registered Users</h3>
          <div className="flex flex-wrap items-center gap-4">
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">Density:</span>
              <button 
                onClick={() => setIsCompact(false)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${!isCompact ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >Comfortable</button>
              <button 
                onClick={() => setIsCompact(true)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${isCompact ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >Compact</button>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-4 py-4">
            <SkeletonLine className="h-10 w-full" />
            <SkeletonLine className="h-10 w-full" />
            <SkeletonLine className="h-10 w-full" />
            <SkeletonLine className="h-10 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="pb-3 px-4 font-medium cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort('username')}>Username {sortField === 'username' && (sortAsc ? '↑' : '↓')}</th>
                  <th className="pb-3 px-4 font-medium cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort('role')}>Role {sortField === 'role' && (sortAsc ? '↑' : '↓')}</th>
                  <th className="pb-3 px-4 font-medium cursor-pointer hover:text-slate-800 dark:hover:text-slate-200" onClick={() => handleSort('created_at')}>Created At {sortField === 'created_at' && (sortAsc ? '↑' : '↓')}</th>
                  <th className="pb-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {displayedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/25 transition-colors">
                    <td className={`${isCompact ? 'py-2' : 'py-4'} px-4 font-medium text-slate-800 dark:text-slate-200`}>
                      {user.username}
                    </td>
                    <td className={`${isCompact ? 'py-2' : 'py-4'} px-4`}>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        {editingRoleId === user.id ? (
                          <select 
                            defaultValue={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value, user.username)}
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            onBlur={() => setEditingRoleId(null)}
                          >
                            <option value="Employee">Employee</option>
                            <option value="Manager">Manager</option>
                            <option value="Owner">Owner</option>
                          </select>
                        ) : (
                          <span className="text-sm text-slate-600 dark:text-slate-300">{user.role}</span>
                        )}
                      </div>
                    </td>
                    <td className={`${isCompact ? 'py-2' : 'py-4'} px-4 text-sm text-slate-500 dark:text-slate-400`}>
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                    <td className={`${isCompact ? 'py-2' : 'py-4'} px-4 text-right`}>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingRoleId(user.id)}
                          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Edit Role"
                        >
                          <FaUserGear />
                        </button>
                        <button 
                          onClick={() => handleResetPassword(user.id, user.username)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <FaKey />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500 dark:text-slate-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default UsersTab;
