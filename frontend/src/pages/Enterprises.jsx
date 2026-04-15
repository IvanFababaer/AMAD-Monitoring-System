import React, { useState, useEffect, useRef } from 'react';
import { enterpriseApi, treeApi } from '../services/api'; 
import { read, utils } from 'xlsx'; // Kept for reading the uploads
import ExcelJS from 'exceljs'; // NEW: For beautiful styled exports
import { saveAs } from 'file-saver'; // NEW: For saving the styled file

const Enterprises = () => {
  const [enterprises, setEnterprises] = useState([]);
  const [trees, setTrees] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  // Filters & Pagination
  const [selectedProvince, setSelectedProvince] = useState('All');
  const [selectedCommodity, setSelectedCommodity] = useState('All');
  const [selectedEnterprise, setSelectedEnterprise] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); 

  const provinces = ['All', 'Oriental Mindoro', 'Occidental Mindoro', 'Marinduque', 'Romblon', 'Palawan'];
  const fileInputRef = useRef(null);

  const initialFormState = { 
    name: '', commodity: '', province: 'Oriental Mindoro', 
    municipality: '', barangay: '', farm_area: '' 
  };
  const [formData, setFormData] = useState(initialFormState);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [entRes, treeRes] = await Promise.all([
        enterpriseApi.getAll(),
        treeApi.getAll()
      ]);
      setEnterprises(entRes.data?.data || entRes.data || []);
      setTrees(treeRes.data?.data || treeRes.data || []);
    } catch (error) {
      console.error("Failed to load data", error);
      showNotification("Failed to load database records.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProvince, selectedCommodity, selectedEnterprise, rowsPerPage]);

  const filteredEnterprises = enterprises.filter(ent => {
    const matchesProvince = selectedProvince === 'All' || ent.province === selectedProvince;
    const matchesCommodity = selectedCommodity === 'All' || ent.commodity === selectedCommodity;
    const matchesEnterprise = selectedEnterprise === 'All' || ent.name === selectedEnterprise;
    return matchesProvince && matchesCommodity && matchesEnterprise;
  });

  const totalPages = Math.ceil(filteredEnterprises.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredEnterprises.slice(indexOfFirstItem, indexOfLastItem);

  const uniqueCommodities = ['All', ...Array.from(new Set(enterprises.map(e => e.commodity).filter(Boolean)))];
  const uniqueEnterpriseNames = ['All', ...Array.from(new Set(enterprises.map(e => e.name).filter(Boolean)))];

  const getSpeciesColor = (speciesName) => {
    const name = speciesName.toLowerCase();
    const colorMap = {
      'mango': 'bg-amber-100 text-amber-800 border-amber-200',
      'coconut': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'cacao': 'bg-orange-100 text-orange-800 border-orange-200',
      'coffee': 'bg-stone-200 text-stone-800 border-stone-300',
      'narra': 'bg-rose-100 text-rose-800 border-rose-200',
      'mahogany': 'bg-red-100 text-red-800 border-red-200',
      'bamboo': 'bg-lime-100 text-lime-800 border-lime-200',
      'calamansi': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'rubber': 'bg-slate-200 text-slate-800 border-slate-300',
      'rambutan': 'bg-pink-100 text-pink-800 border-pink-200',
      'lanzones': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      'durian': 'bg-green-100 text-green-800 border-green-200',
      'cashew': 'bg-orange-50 text-orange-700 border-orange-200',
      'jackfruit': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    };
    for (const [key, value] of Object.entries(colorMap)) {
      if (name.includes(key)) return value;
    }
    const fallbackColors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-cyan-100 text-cyan-800 border-cyan-200'
    ];
    return fallbackColors[name.length % fallbackColors.length];
  };

  const getUtilization = (entId, totalArea) => {
    const area = parseFloat(totalArea) || 0;
    const enterpriseTrees = trees.filter(t => t.enterprise_id !== null && t.enterprise_id !== undefined && String(t.enterprise_id) === String(entId));
    
    const planted = enterpriseTrees.reduce((sum, t) => {
      const treeArea = parseFloat(t.hectares);
      return sum + (isNaN(treeArea) ? 0 : treeArea);
    }, 0);
    
    const available = Math.max(0, area - planted);
    const pct = area > 0 ? Math.min(100, (planted / area) * 100) : 0;
    
    let progressColorClass = 'bg-green-500';
    if (pct >= 90) progressColorClass = 'bg-red-500';
    else if (pct >= 70) progressColorClass = 'bg-yellow-400';

    const plantedSpecies = Array.from(new Set(enterpriseTrees.map(t => t.common_name).filter(Boolean)));
    
    return { 
      planted: planted.toFixed(2), 
      available: available.toFixed(2), 
      pct: pct.toFixed(1),
      total: area.toFixed(2),
      species: plantedSpecies,
      progressColorClass
    };
  };

  // --- NEW: ADVANCED EXCEL EXPORT WITH COLORS & STYLING ---
  const downloadReport = async () => {
    if (filteredEnterprises.length === 0) return showNotification('No data to export!', 'error');
    
    showNotification('Generating styled report...', 'success');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Enterprise Report');

    // 1. Create Title Row
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'AMAD MIMAROPA - Enterprise Land Utilization Report';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }; // White text
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } }; // Dark Green BG
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;

    // 2. Create Date Row
    worksheet.mergeCells('A2:J2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Generated on: ${new Date().toLocaleDateString()}`;
    dateCell.font = { italic: true, color: { argb: 'FF4B5563' } }; // Gray text
    dateCell.alignment = { horizontal: 'right' };
    worksheet.addRow([]); // Empty spacing row

    // 3. Create Headers
    const headers = ['ID', 'Enterprise Name', 'Commodity', 'Province', 'Municipality', 'Barangay', 'Total Area (ha)', 'Planted (ha)', 'Available (ha)', 'Planted Trees'];
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 25;

    // Style the Headers
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } }; // Bright Green BG
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF166534' } },
        bottom: { style: 'thin', color: { argb: 'FF166534' } },
      };
    });

    // 4. Add Data and Style Individual Cells
    filteredEnterprises.forEach((e, index) => {
      const util = getUtilization(e.id, e.farm_area);
      const treeNames = util.species.join(', ') || 'None';
      
      const row = worksheet.addRow([
        e.id, e.name, e.commodity || 'N/A', e.province || 'N/A',
        e.municipality || 'N/A', e.barangay || 'N/A',
        Number(util.total), Number(util.planted), Number(util.available), treeNames
      ]);

      // Zebra striping (alternate row colors)
      const isEven = index % 2 === 0;
      row.eachCell((cell, colNumber) => {
        if (isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Light gray
        }
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        cell.alignment = { vertical: 'middle' };

        // Center align the number columns
        if (colNumber === 1 || (colNumber >= 7 && colNumber <= 9)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });

      // --- COLOR-CODE THE AVAILABLE LAND ---
      const availableCell = row.getCell(9); // Column I
      if (Number(util.total) > 0) {
        const pct = util.pct;
        if (pct >= 90) {
          availableCell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Red text
        } else if (pct >= 70) {
          availableCell.font = { color: { argb: 'FFD97706' }, bold: true }; // Orange text
        } else {
          availableCell.font = { color: { argb: 'FF16A34A' }, bold: true }; // Green text
        }
      }
    });

    // 5. Adjust Column Widths
    worksheet.columns = [
      { width: 8 },   // A: ID
      { width: 45 },  // B: Enterprise Name
      { width: 18 },  // C: Commodity
      { width: 20 },  // D: Province
      { width: 20 },  // E: Municipality
      { width: 20 },  // F: Barangay
      { width: 16 },  // G: Total Area
      { width: 16 },  // H: Planted
      { width: 16 },  // I: Available
      { width: 60 },  // J: Planted Trees
    ];

    // 6. Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `AMAD_Land_Report_${new Date().getTime()}.xlsx`);
  };

  // --- EXCEL IMPORT LOGIC (Unchanged) ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showNotification('Reading Excel file...', 'success');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target.result;
        const workbook = read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const excelData = utils.sheet_to_json(worksheet, { header: 1 });
        const rows = excelData.slice(1); 
        
        let importCount = 0;
        let errorCount = 0;

        for (let row of rows) {
          if (!row || row.length === 0 || !row[0]) continue; 

          const rawName = row[0] ? String(row[0]).trim() : '';
          const rawCommodity = row[1] ? String(row[1]).trim() : 'Unspecified';
          
          let rawProvince = 'Oriental Mindoro'; 
          if (row[2]) {
            const excelProvince = String(row[2]).trim().toLowerCase();
            const matchedProvince = provinces.find(
              p => p !== 'All' && p.toLowerCase() === excelProvince
            );
            if (matchedProvince) { rawProvince = matchedProvince; }
          }

          const rawMunicipality = row[3] ? String(row[3]).trim() : 'Unspecified';
          const rawBarangay = row[4] ? String(row[4]).trim() : 'Unspecified';
          
          let rawFarmArea = 0; 
          if (row[5]) {
             const parsed = parseFloat(String(row[5]).replace(/[^0-9.]/g, '')); 
             if (!isNaN(parsed)) rawFarmArea = parsed;
          }

          const newEnt = {
            name: rawName, commodity: rawCommodity, province: rawProvince,
            municipality: rawMunicipality, barangay: rawBarangay, farm_area: rawFarmArea,
          };
          
          if (newEnt.name) {
            try {
              await enterpriseApi.create(newEnt);
              importCount++;
            } catch (err) { errorCount++; }
          }
        }
        
        if (errorCount > 0) showNotification(`Imported ${importCount} records. ${errorCount} failed.`, 'error');
        else showNotification(`Successfully imported ${importCount} enterprises!`);
        
        fetchAllData(); 
      } catch (err) {
        showNotification("Failed to parse Excel file. Is it corrupted?", "error");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditClick = (enterprise) => {
    setEditingId(enterprise.id);
    setFormData(enterprise);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await enterpriseApi.delete(id);
      fetchAllData();
      showNotification(`${name} deleted successfully.`);
    } catch (error) {
      showNotification('Error deleting enterprise.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanData = { ...formData };
      cleanData.farm_area = cleanData.farm_area ? parseFloat(cleanData.farm_area) : 0;
      if (editingId) {
        await enterpriseApi.update(editingId, cleanData);
        showNotification('Enterprise updated successfully!');
      } else {
        await enterpriseApi.create(cleanData);
        showNotification('New enterprise registered successfully!');
      }
      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingId(null);
      fetchAllData();
    } catch (error) {
      showNotification('Error saving enterprise.', 'error');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      
      {/* Toast Notification */}
      {notification.show && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-xl text-white font-bold z-50 flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.message}
        </div>
      )}

      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Enterprise Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage partner farms and track available planting capacity.</p>
        </div>
        
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />
          
          <button onClick={() => fileInputRef.current.click()} className="bg-white border-2 border-green-700 text-green-800 hover:bg-green-50 px-4 py-2 rounded-lg shadow-sm font-bold transition-colors">
            ↑ Upload Excel
          </button>
          
          <button onClick={downloadReport} className="bg-white border-2 border-green-700 text-green-800 hover:bg-green-50 px-4 py-2 rounded-lg shadow-sm font-bold transition-colors">
            ↓ Export Excel
          </button>

          <button onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }} className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg shadow-md font-medium transition-colors">
            + Add Enterprise
          </button>
        </div>
      </div>

      {/* Clean Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-6 flex-1">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Province</label>
              <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none">
                {provinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Commodity</label>
              <select value={selectedCommodity} onChange={(e) => setSelectedCommodity(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none">
                {uniqueCommodities.map(comm => <option key={comm} value={comm}>{comm}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Enterprise Name</label>
              <select value={selectedEnterprise} onChange={(e) => setSelectedEnterprise(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none">
                {uniqueEnterpriseNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
             <label className="text-xs font-bold text-gray-500 uppercase">Show</label>
             <select 
              value={rowsPerPage} 
              onChange={(e) => setRowsPerPage(Number(e.target.value))} 
              className="border border-gray-300 rounded px-2 py-1 text-sm font-medium text-green-800 outline-none"
             >
               <option value={5}>5</option>
               <option value={10}>10</option>
               <option value={25}>25</option>
               <option value={50}>50</option>
             </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Enterprise Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Commodity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[22rem]">Land & Crop Details</th>
                <th className="px-6 py-4 text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading enterprises and calculating capacity...</td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No records found matching your current filters.</td>
                </tr>
              ) : (
                currentItems.map((ent) => {
                  const util = getUtilization(ent.id, ent.farm_area);
                  
                  return (
                  <tr key={ent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">{ent.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
                        {ent.commodity || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ent.municipality}, {ent.province}</div>
                      <div className="text-xs text-gray-500">Brgy. {ent.barangay}</div>
                    </td>
                    
                    {/* Land Utilization & Species Tags */}
                    <td className="px-6 py-4">
                      {parseFloat(util.total) === 0 ? (
                        <span className="text-xs text-gray-400 italic">Area not defined</span>
                      ) : (
                        <div className="w-full">
                          {/* Progress text */}
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-gray-700">{util.planted}ha planted</span>
                            <span className="font-bold text-gray-500">{util.available}ha avail</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex mb-2">
                            <div className={`${util.progressColorClass} h-2 transition-all duration-500`} style={{ width: `${util.pct}%` }}></div>
                          </div>
                          
                          {/* Tree Species Badges */}
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {util.species.length > 0 ? (
                              <>
                                {util.species.slice(0, 3).map((treeName, i) => (
                                  <span 
                                    key={i} 
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border shadow-sm ${getSpeciesColor(treeName)}`}
                                  >
                                    {treeName}
                                  </span>
                                ))}
                                {util.species.length > 3 && (
                                  <span className="text-[10px] font-bold bg-gray-50 text-gray-500 px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                                    +{util.species.length - 3} more
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">No trees logged yet</span>
                            )}
                          </div>
                          
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEditClick(ent)} className="text-green-600 hover:text-green-900 mr-4 font-bold">Edit</button>
                      <button onClick={() => handleDeleteClick(ent.id, ent.name)} className="text-red-600 hover:text-red-900 font-bold">Delete</button>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Pagination Controls */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Showing {filteredEnterprises.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredEnterprises.length)} of {filteredEnterprises.length} records
          </div>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className={`px-4 py-2 rounded-lg border font-bold text-xs transition-all ${currentPage === 1 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-green-700 border-green-200 hover:bg-green-50'}`}
            >
              Previous
            </button>
            <div className="flex items-center px-4 text-sm font-black text-green-900">
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
      </div>

      {/* Simple Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-green-900">{editingId ? 'Edit Enterprise' : 'Register Enterprise'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Enterprise Name *</label>
                  <input type="text" name="name" value={formData.name} required onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Commodity *</label>
                  <input type="text" name="commodity" value={formData.commodity} required onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Province *</label>
                  <select name="province" value={formData.province || 'Oriental Mindoro'} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-green-500 outline-none">
                    {provinces.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Municipality</label>
                  <input type="text" name="municipality" value={formData.municipality} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Barangay</label>
                  <input type="text" name="barangay" value={formData.barangay} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Total Farm Area (Hectares)</label>
                <input type="number" step="0.01" name="farm_area" value={formData.farm_area} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none" />
                <p className="text-[10px] text-gray-400 mt-1">Available land will be calculated automatically based on planted trees.</p>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md shadow font-medium transition-colors">
                  {editingId ? 'Save Changes' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Enterprises;