import React, { useState, useEffect, useRef } from 'react';
import { treeApi, enterpriseApi } from '../services/api';

const TreeInventory = () => {
  const [trees, setTrees] = useState([]);
  const [enterpriseOptions, setEnterpriseOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const [selectedProvince, setSelectedProvince] = useState('All');
  const [selectedEnterprise, setSelectedEnterprise] = useState('All');
  const provinces = ['All', 'Oriental Mindoro', 'Occidental Mindoro', 'Marinduque', 'Romblon', 'Palawan'];

  const uploadRef = useRef(null);

  const initialFormState = {
    enterprise_id: '', common_name: '', species: '', province: 'Oriental Mindoro',
    municipality: '', barangay: '', latitude: '', longitude: '',
    date_planted: '', hectares: '', age: '', health_status: 'Healthy', quantity: '1',
    imageFile: null, imagePreview: '' 
  };

  const [formData, setFormData] = useState(initialFormState);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [treeRes, entRes] = await Promise.all([ treeApi.getAll(), enterpriseApi.getAll() ]);
      setTrees(treeRes.data.data || []);
      setEnterpriseOptions(entRes.data.data || []);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProvince, selectedEnterprise, rowsPerPage]);

  const uniqueEnterpriseNames = ['All', 'Independent', ...Array.from(new Set(enterpriseOptions.map(e => e.name)))];
  
  const filteredTrees = trees.filter(tree => {
    const entName = tree.enterprises ? tree.enterprises.name : 'Independent';
    const matchesProv = selectedProvince === 'All' || tree.province === selectedProvince;
    const matchesEnt = selectedEnterprise === 'All' || entName === selectedEnterprise;
    return matchesProv && matchesEnt;
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredTrees.slice(indexOfFirstRow, indexOfLastRow); 
  const totalPages = Math.ceil(filteredTrees.length / rowsPerPage);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showNotification('Geolocation is not supported by your browser.', 'error');
      return;
    }
    showNotification('Fetching GPS coordinates...', 'success');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        });
        showNotification('Location successfully acquired!', 'success');
      },
      (error) => {
        showNotification('Failed to get location.', 'error');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData({ ...formData, imageFile: file, imagePreview: previewUrl });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // --- FIXED SUBMIT LOGIC (CRITICAL FIXES HERE) ---
  // --- ROBUST SUBMIT LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Lock the button

    try {
      const data = new FormData();
      
      // 1. Append text fields INTELLIGENTLY
      Object.keys(formData).forEach(key => {
        // Skip file/preview fields
        if (key === 'imageFile' || key === 'imagePreview') return;

        let value = formData[key];

        // SAFETY: If these number/date fields are empty, DO NOT send them.
        // Sending "" (empty string) to a number column crashes the database (500 Error).
        if ((key === 'enterprise_id' || key === 'age' || key === 'hectares' || key === 'date_planted') && !value) {
           return; 
        }

        // Clean up: If value is null, convert to empty string or skip
        if (value === null || value === undefined) return;

        data.append(key, value);
      });

      // 2. Append the Image (Only if a NEW file was selected)
      if (formData.imageFile) {
        // 'photo' MUST match the name in your backend: upload.single('photo')
        data.append('photo', formData.imageFile); 
      }

      // 3. Send Request
      if (editingId) {
        // UPDATE (PUT)
        await treeApi.update(editingId, data);
        showNotification('Tree record updated successfully!');
      } else {
        // CREATE (POST)
        await treeApi.create(data);
        showNotification('New tree registered successfully!');
      }
      
      // 4. Reset Form
      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingId(null);
      
      // 5. Refresh List
      await fetchAllData(); 
      
    } catch (error) {
      console.error("Submission Error:", error);
      // Show the actual error message from the server if it exists
      const serverMessage = error.response?.data?.message || 'Server Error. Check Backend Terminal.';
      showNotification(serverMessage, 'error');
    } finally {
      setIsLoading(false); // Unlock the button
    }
  };

  const handleEditClick = (tree) => {
    setEditingId(tree.id);
    const formattedDate = tree.date_planted ? new Date(tree.date_planted).toISOString().split('T')[0] : '';
    setFormData({
      ...tree,
      date_planted: formattedDate,
      enterprise_id: tree.enterprise_id || '',
      quantity: tree.quantity || '1',
      barangay: tree.barangay || '', 
      imageFile: null,
      imagePreview: tree.image_url || '' 
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id, name) => {
    if (!window.confirm(`Delete ${name} record?`)) return;
    try {
      await treeApi.delete(id);
      fetchAllData(); 
      showNotification(`${name} deleted successfully.`);
    } catch (error) {
      showNotification('Error deleting tree.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Healthy': 'bg-green-100 text-green-800',
      'Needs Attention': 'bg-yellow-100 text-yellow-800',
      'Diseased': 'bg-red-100 text-red-800'
    };
    return <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative font-sans">
      
      {notification.show && (
        <div className={`absolute top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-xl font-bold text-sm transform transition-all ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* HEADER & FILTER SECTION */}
      <div className="sticky top-0 z-20 bg-gray-50 p-6 pb-2 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-900">Tree Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">Manage, filter, and track all registered trees.</p>
          </div>
          <button onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }} className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg shadow-md font-medium transition-colors">
            + Add New Tree
          </button>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-6 flex-1">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Province</label>
                <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} className="w-full border border-gray-300 text-gray-700 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none">
                  {provinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Enterprise / Farm</label>
                <select value={selectedEnterprise} onChange={(e) => setSelectedEnterprise(e.target.value)} className="w-full border border-gray-300 text-gray-700 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none">
                  {uniqueEnterpriseNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Show</label>
               <select 
                value={rowsPerPage} 
                onChange={(e) => setRowsPerPage(Number(e.target.value))} 
                className="border border-gray-300 rounded px-2 py-1 text-sm font-bold text-green-800 outline-none"
               >
                 <option value={5}>5</option>
                 <option value={10}>10</option>
                 <option value={25}>25</option>
                 <option value={50}>50</option>
               </select>
            </div>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="flex-1 overflow-y-auto px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tree / Species</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Enterprise</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Health Status</th>
                <th className="relative px-6 py-4 text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">Loading inventory data...</td></tr>
              ) : currentRows.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No trees match your filters.</td></tr>
              ) : (
                currentRows.map((tree) => (
                  <tr key={tree.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {tree.image_url ? (
                          <img src={tree.image_url} alt={tree.common_name} className="h-10 w-10 rounded-lg object-cover mr-3 border border-gray-200 shadow-sm" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center mr-3 text-green-700 font-bold text-[10px]">IMG</div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-gray-900">{tree.common_name}</div>
                          <div className="text-xs italic text-gray-500">{tree.species}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-black text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                        {tree.quantity || 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tree.enterprises?.name ? (
                        <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">{tree.enterprises.name}</span>
                      ) : <span className="text-sm italic text-gray-400">Independent</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tree.municipality}, {tree.province}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest">Brgy. {tree.barangay}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(tree.health_status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(tree)} className="text-green-600 hover:text-green-900 font-bold mr-4 transition-colors">Edit</button>
                        <button onClick={() => handleDeleteClick(tree.id, tree.common_name)} className="text-red-600 hover:text-red-900 font-bold transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-10 shadow-lg shadow-gray-200/50">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredTrees.length)} of {filteredTrees.length} records
        </div>
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className={`px-4 py-2 rounded-lg border font-bold text-xs transition-all ${currentPage === 1 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-green-700 border-green-200 hover:bg-green-50'}`}
          >
            Previous
          </button>
          <div className="flex items-center px-4 text-sm font-black text-green-900 bg-green-50 rounded-lg">
            {currentPage} / {totalPages || 1}
          </div>
          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className={`px-4 py-2 rounded-lg border font-bold text-xs transition-all ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-green-700 border-green-200 hover:bg-green-50'}`}
          >
            Next
          </button>
        </div>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-green-900 italic tracking-tight">{editingId ? 'Update Tree Record' : 'Register New Tree'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-gray-800">
              <form id="tree-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Image Upload Area */}
                <div className="md:col-span-2 flex items-center gap-6 bg-green-50/30 p-4 rounded-xl border border-green-100 group">
                  <div 
                    className="w-28 h-28 rounded-xl border-2 border-dashed border-green-200 flex items-center justify-center bg-white cursor-pointer overflow-hidden relative shadow-inner"
                    onClick={() => uploadRef.current.click()}
                  >
                    {formData.imagePreview ? (
                      <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="text-green-400 flex flex-col items-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span className="text-[10px] font-bold mt-1 tracking-widest uppercase">Select Photo</span>
                      </div>
                    )}
                    <input type="file" ref={uploadRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-800 text-sm tracking-tight uppercase">Visual Documentation</h3>
                    <p className="text-xs text-gray-500 mb-2 max-w-xs leading-relaxed font-medium">Add a photo of the tree or land for regional monitoring and verification.</p>
                  </div>
                </div>

                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Common Name *</label>
                    <input required type="text" name="common_name" value={formData.common_name} onChange={handleInputChange} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-lg px-4 py-2.5 focus:border-green-500 focus:bg-white outline-none transition-all font-bold" placeholder="e.g. Mango" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Scientific Species</label>
                    <input type="text" name="species" value={formData.species} onChange={handleInputChange} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-lg px-4 py-2.5 focus:border-green-500 focus:bg-white outline-none transition-all italic" placeholder="e.g. Mangifera indica" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Enterprise Association</label>
                    <select name="enterprise_id" value={formData.enterprise_id} onChange={handleInputChange} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-lg px-4 py-2.5 focus:border-green-500 focus:bg-white outline-none font-bold cursor-pointer">
                      <option value="">-- Independent Farm --</option>
                      {enterpriseOptions.map(ent => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Date Planted</label>
                      <input type="date" name="date_planted" value={formData.date_planted} onChange={handleInputChange} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-lg px-4 py-2.5 focus:border-green-500 focus:bg-white outline-none font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Current Health</label>
                      <select name="health_status" value={formData.health_status} onChange={handleInputChange} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-lg px-4 py-2.5 focus:border-green-500 focus:bg-white outline-none font-bold cursor-pointer">
                        <option value="Healthy">Healthy</option>
                        <option value="Needs Attention">Needs Attention</option>
                        <option value="Diseased">Diseased</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-green-700 uppercase tracking-widest mb-1.5 ml-1">Total Quantity *</label>
                    <input required type="number" min="1" name="quantity" value={formData.quantity} onChange={handleInputChange} className="w-full border-2 border-green-100 bg-green-50 rounded-lg px-4 py-2.5 text-xl font-black text-green-900 focus:ring-4 focus:ring-green-500/10 outline-none transition-all shadow-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Province</label>
                      <select name="province" value={formData.province} onChange={handleInputChange} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-lg px-4 py-2.5 focus:border-green-500 focus:bg-white outline-none font-bold">
                        {provinces.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Municipality</label>
                      <input type="text" name="municipality" value={formData.municipality} onChange={handleInputChange} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-lg px-4 py-2.5 focus:border-green-500 focus:bg-white outline-none font-bold" />
                    </div>
                  </div>

                  {/* Barangy Field */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Barangay</label>
                    <input type="text" name="barangay" value={formData.barangay} onChange={handleInputChange} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-lg px-4 py-2.5 focus:border-green-500 focus:bg-white outline-none font-bold" placeholder="e.g. San Jose" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Age (Years)</label>
                      <input type="number" step="any" name="age" value={formData.age} onChange={handleInputChange} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-lg px-4 py-2.5 focus:border-green-500 focus:bg-white outline-none font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Area (ha)</label>
                      <input type="number" step="any" name="hectares" value={formData.hectares} onChange={handleInputChange} className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-lg px-4 py-2.5 focus:border-green-500 focus:bg-white outline-none font-bold" />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Geolocation Matrix</label>
                      <button type="button" onClick={handleGetLocation} className="text-[9px] font-black bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-full shadow-md shadow-blue-200 transition-all active:scale-95 uppercase">
                        GET GPS
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Latitude" name="latitude" value={formData.latitude} onChange={handleInputChange} className="w-full border-2 border-white bg-white rounded-lg px-3 py-2 text-xs font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-400" />
                      <input type="text" placeholder="Longitude" name="longitude" value={formData.longitude} onChange={handleInputChange} className="w-full border-2 border-white bg-white rounded-lg px-3 py-2 text-xs font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-500 font-bold hover:text-gray-700 transition-colors uppercase text-xs tracking-widest">Cancel</button>
              <button type="submit" form="tree-form" className="px-10 py-2.5 bg-green-700 hover:bg-green-800 text-white font-black rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-95 uppercase text-xs tracking-widest">
                {editingId ? 'Update Record' : 'Commit Entry'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default TreeInventory;