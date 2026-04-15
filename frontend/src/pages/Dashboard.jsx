import React, { useState, useEffect } from 'react';
import { analyticsApi, treeApi } from '../services/api';
import { 
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, Filler 
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register Chart components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, Filler);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [enterpriseCount, setEnterpriseCount] = useState(0); 
  const [totalTreeCount, setTotalTreeCount] = useState(0); // <-- NEW STATE FOR TRUE TOTAL
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState('All');
  
  const provinces = ['All', 'Oriental Mindoro', 'Occidental Mindoro', 'Marinduque', 'Romblon', 'Palawan'];

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const queryParam = selectedProvince === 'All' ? null : selectedProvince;
      
      // 1. Fetch existing dashboard summary data
      const response = await analyticsApi.getSummary(queryParam);
      setStats(response.data.data);

      // 2. Fetch raw tree data to calculate unique enterprises & TRUE totals
      const treeResponse = await treeApi.getAll();
      const allTrees = treeResponse.data.data || [];

      // Filter trees by selected province
      const filteredTrees = selectedProvince === 'All' 
        ? allTrees 
        : allTrees.filter(t => t.province === selectedProvince);

      // --- FIX: Calculate actual total trees using the new 'quantity' field ---
      const actualTotal = filteredTrees.reduce((sum, tree) => {
        return sum + (Number(tree.quantity) || 1); // Defaults to 1 if quantity is null
      }, 0);
      setTotalTreeCount(actualTotal);

      // Extract unique enterprise names
      const uniqueEnterprises = new Set(
        filteredTrees
          .map(tree => tree.enterprise || tree.enterprise_name || tree.enterprises?.name) 
          .filter(ent => ent && String(ent).trim() !== '')
      );
      
      setEnterpriseCount(uniqueEnterprises.size); 

    } catch (error) {
      console.error("Failed to load dashboard stats", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedProvince]);

  if (!stats && !isLoading) return <div className="p-6 text-red-500">Failed to load data.</div>;

  // ==========================================
  // 🎨 SYNCHRONIZED GRAPH CONFIGURATIONS
  // ==========================================

  const healthData = {
    labels: ['Healthy', 'Needs Attention', 'Diseased'],
    datasets: [{
      data: [
        stats?.healthStatus?.Healthy || 0,
        stats?.healthStatus?.['Needs Attention'] || 0,
        stats?.healthStatus?.Diseased || 0
      ],
      // Darker semantic colors: Dark Emerald, Dark Amber, Dark Red
      backgroundColor: ['#059669', '#d97706', '#dc2626'], 
      hoverBackgroundColor: ['#047857', '#b45309', '#b91c1c'],
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverOffset: 8,
    }],
  };

  const doughnutOptions = {
    cutout: '75%',
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 20, font: { family: "'Inter', sans-serif", size: 12 } }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 14 },
        bodyFont: { size: 13 }
      }
    }
  };

  const locationData = {
    labels: Object.keys(stats?.locationDistribution || {}),
    datasets: [{
      label: 'Number of Clusters/Rows',
      data: Object.values(stats?.locationDistribution || {}),
      backgroundColor: [
        '#022c22', // Very Dark Green
        '#064e3b', 
        '#047857', 
        '#059669', 
        '#10b981', 
        '#34d399', 
        '#6ee7b7', 
        '#a7f3d0'  // Very Pale Green
      ], 
      hoverBackgroundColor: [
        '#000000', '#022c22', '#064e3b', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7'
      ], 
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 48,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y} Records Cataloged`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9', drawBorder: false }, 
        ticks: { stepSize: 1, color: '#64748b', font: { size: 12 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { weight: '500', size: 12 } }
      }
    }
  };

  const totalHealth = (stats?.healthStatus?.Healthy || 0) + (stats?.healthStatus?.['Needs Attention'] || 0) + (stats?.healthStatus?.Diseased || 0);
  const healthyPercentage = totalHealth > 0 ? Math.round(((stats?.healthStatus?.Healthy || 0) / totalHealth) * 100) : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* SYNCHRONIZED HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-900">System Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time overview of the MIMAROPA tree inventory.</p>
        </div>
        
        <button 
          onClick={fetchStats}
          className="bg-white border border-gray-200 text-green-700 hover:bg-green-50 hover:border-green-600 px-5 py-2.5 rounded-xl shadow-sm font-bold transition-all flex items-center gap-2 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* SYNCHRONIZED FILTER ROW */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <span className="text-sm font-bold text-gray-500 flex items-center mr-2 uppercase tracking-wider text-xs">Filter Region:</span>
        {provinces.map((prov) => (
          <button
            key={prov}
            onClick={() => setSelectedProvince(prov)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedProvince === prov 
                ? 'bg-green-700 text-white shadow-lg scale-105' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {prov}
          </button>
        ))}
      </div>
      
      {isLoading ? (
        <div className="p-6 text-green-700 font-bold animate-pulse text-center">
          Fetching {selectedProvince} data...
        </div>
      ) : stats?.totalTrees === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100 text-gray-500 font-medium">
          No inventory data available for {selectedProvince} yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-t-4 border-t-green-600 transition-transform hover:scale-[1.02]">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Trees</h3>
              {/* NOW USING totalTreeCount */}
              <p className="text-3xl lg:text-4xl font-black text-green-900 mt-2">{totalTreeCount.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-t-4 border-t-emerald-500 transition-transform hover:scale-[1.02]">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Healthy</h3>
              <p className="text-3xl lg:text-4xl font-black text-green-600 mt-2">{stats.healthStatus?.Healthy || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-t-4 border-t-yellow-500 transition-transform hover:scale-[1.02]">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Needs Attention</h3>
              <p className="text-3xl lg:text-4xl font-black text-yellow-600 mt-2">{stats.healthStatus?.['Needs Attention'] || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-t-4 border-t-red-500 transition-transform hover:scale-[1.02]">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Diseased</h3>
              <p className="text-3xl lg:text-4xl font-black text-red-600 mt-2">{stats.healthStatus?.Diseased || 0}</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-t-4 border-t-blue-500 transition-transform hover:scale-[1.02] col-span-2 md:col-span-1">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Enterprises</h3>
              <p className="text-3xl lg:text-4xl font-black text-blue-700 mt-2">{enterpriseCount}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-800 font-bold">Health Status</h3>
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase tracking-widest">Real-time</span>
              </div>
              <div className="relative h-64 flex justify-center">
                <Doughnut data={healthData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-black text-slate-800">{healthyPercentage}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Healthy</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-800 font-bold">
                  {selectedProvince === 'All' ? 'Distribution by Province' : `Distribution in ${selectedProvince}`}
                </h3>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold uppercase tracking-widest">Location Split</span>
              </div>
              <div className="relative h-64 w-full">
                <Bar data={locationData} options={barOptions} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;