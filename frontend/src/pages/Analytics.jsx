import React, { useState, useEffect } from 'react';
import { treeApi, enterpriseApi } from '../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const Analytics = () => {
  const [trees, setTrees] = useState([]);
  const [enterprises, setEnterprises] = useState([]); // NEW: Added Enterprises
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedProvince, setSelectedProvince] = useState('All');
  const provinces = ['All', 'Oriental Mindoro', 'Occidental Mindoro', 'Marinduque', 'Romblon', 'Palawan'];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // NEW: Fetch both trees and enterprises at the same time
        const [treeRes, entRes] = await Promise.all([
          treeApi.getAll(),
          enterpriseApi.getAll()
        ]);
        setTrees(treeRes.data.data || []);
        setEnterprises(entRes.data.data || []);
      } catch (error) {
        console.error("Failed to fetch data for analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // --- THE FILTER ENGINE ---
  const filteredTrees = selectedProvince === 'All' 
    ? trees 
    : trees.filter(tree => tree.province === selectedProvince);

  const filteredEnterprises = selectedProvince === 'All'
    ? enterprises
    : enterprises.filter(ent => ent.province === selectedProvince);

  // --- DATA CRUNCHING: LAND UTILIZATION ---
  
  // 1. Total Land Capacity (From Enterprises)
  const totalFarmArea = filteredEnterprises.reduce((sum, ent) => sum + (parseFloat(ent.farm_area) || 0), 0);
  
  // 2. Total Planted Area (From Trees)
  const totalPlantedArea = filteredTrees.reduce((sum, tree) => sum + (parseFloat(tree.hectares) || 0), 0);
  
  // 3. Available Hectares (Capacity minus Planted)
  const availableHectares = Math.max(0, totalFarmArea - totalPlantedArea).toFixed(2);
  
  // 4. Utilization Percentage for Progress Bar
  const utilizationPct = totalFarmArea > 0 ? ((totalPlantedArea / totalFarmArea) * 100).toFixed(1) : 0;


  // --- DATA CRUNCHING: SPECIES & TIMELINE ---
  const speciesCount = {};
  filteredTrees.forEach(tree => {
    const species = tree.common_name || 'Unknown';
    speciesCount[species] = (speciesCount[species] || 0) + 1;
  });

  const sortedSpeciesEntries = Object.entries(speciesCount).sort((a, b) => b[1] - a[1]);
  const sortedSpeciesLabels = sortedSpeciesEntries.map(entry => entry[0]).slice(0, 10); // Top 10
  const sortedSpeciesData = sortedSpeciesEntries.map(entry => entry[1]).slice(0, 10);

  const yearlyPlanting = {};
  filteredTrees.forEach(tree => {
    if (tree.date_planted) {
      const year = new Date(tree.date_planted).getFullYear();
      yearlyPlanting[year] = (yearlyPlanting[year] || 0) + 1;
    }
  });
  
  const sortedYears = Object.keys(yearlyPlanting).sort();
  const timelineData = sortedYears.map(year => yearlyPlanting[year]);

  // --- CHART CONFIGURATIONS ---
  const speciesChartData = {
    labels: sortedSpeciesLabels,
    datasets: [{
      label: 'Total Trees',
      data: sortedSpeciesData,
      backgroundColor: '#22c55e', 
      borderRadius: 4, 
    }]
  };

  const timelineChartData = {
    labels: sortedYears,
    datasets: [{
      label: 'Trees Planted',
      data: timelineData,
      borderColor: '#16a34a',
      backgroundColor: 'rgba(22, 163, 74, 0.2)',
      pointBackgroundColor: '#15803d',
      fill: true,
      tension: 0.4 
    }]
  };

  if (isLoading) {
    return <div className="p-6 text-green-700 font-bold animate-pulse">Crunching Analytics...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Analytics & Land Utilization</h1>
          <p className="text-sm text-gray-500 mt-1">Track planted areas, available hectares, and biodiversity.</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <span className="text-sm font-bold text-gray-500 mr-2 uppercase tracking-wider">Filter Report:</span>
        {provinces.map((prov) => (
          <button
            key={prov}
            onClick={() => setSelectedProvince(prov)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedProvince === prov 
                ? 'bg-green-700 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {prov}
          </button>
        ))}
      </div>

      {filteredTrees.length === 0 && filteredEnterprises.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100 text-gray-500 font-medium">
          No data available for {selectedProvince} yet.
        </div>
      ) : (
        <>
          {/* NEW: Land Utilization Progress Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 border-t-4 border-t-green-600">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Land Utilization</h3>
                <h2 className="text-3xl font-black text-gray-900 mt-1">{utilizationPct}% Planted</h2>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-100 inline-block mb-1">
                  Available: {availableHectares} ha
                </p>
                <p className="text-xs text-gray-400 font-medium">Total Capacity: {totalFarmArea.toFixed(2)} ha</p>
              </div>
            </div>
            
            {/* The Visual Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex shadow-inner">
              <div 
                className="bg-green-500 h-4 transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min(utilizationPct, 100)}%` }}
              ></div>
              <div 
                className="bg-gray-200 h-4 transition-all" 
                style={{ width: `${Math.max(0, 100 - utilizationPct)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between mt-3 text-xs font-bold">
              <span className="text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {totalPlantedArea.toFixed(2)} ha Planted</span>
              <span className="text-gray-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300"></span> {availableHectares} ha Available</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Biodiversity (Unique Species)</h3>
              <p className="text-4xl font-black text-green-700 mt-2">{Object.keys(speciesCount).length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-400">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Most Planted Tree</h3>
              <p className="text-2xl font-black text-green-800 mt-4 leading-none truncate">
                {sortedSpeciesLabels[0] || 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-gray-800 font-bold mb-4">Top 10 Species Distribution</h3>
              <div className="relative h-72 w-full">
                <Bar 
                  data={speciesChartData} 
                  options={{ 
                    indexAxis: 'y',
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { ticks: { stepSize: 1 } } }
                  }} 
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-gray-800 font-bold mb-4">Planting Timeline</h3>
              {sortedYears.length > 0 ? (
                <div className="relative h-72 w-full">
                  <Line 
                    data={timelineChartData} 
                    options={{ 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                    }} 
                  />
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-gray-400 italic">
                  No planting dates recorded yet.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;