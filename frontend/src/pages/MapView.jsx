import React, { useState, useEffect } from 'react';
import { treeApi } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster'; 
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- CUSTOM CSS FOR MODERN LEAFLET CLUSTERS & COMPACT POPUPS ---
const mapStyles = `
  .leaflet-popup-content-wrapper {
    padding: 0 !important;
    border-radius: 12px !important;
    overflow: hidden !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
    border: none !important;
  }
  .leaflet-popup-content {
    margin: 0 !important;
    width: 240px !important; /* Slightly adjusted to fit grid nicely */
  }
  .leaflet-container a.leaflet-popup-close-button {
    color: #94a3b8 !important;
    padding: 6px 6px 0 0 !important;
    z-index: 10;
  }
  .leaflet-container a.leaflet-popup-close-button:hover {
    color: #ef4444 !important;
    background: transparent !important;
  }
  
  /* Individual Marker Animation */
  .custom-tree-marker div { transition: all 0.3s ease; }
  .custom-tree-marker:hover div {
    transform: scale(1.2);
    box-shadow: 0 0 15px rgba(0,0,0,0.4) !important;
  }

  /* Custom Cluster Marker */
  .custom-cluster-marker {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 13px;
    transition: transform 0.2s;
  }
  .custom-cluster-marker:hover {
    transform: scale(1.1);
  }
`;

// --- ICONS ---
const createTreeIcon = (color) => L.divIcon({
  className: 'custom-tree-marker',
  html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -9]
});

const createClusterIcon = (cluster) => {
  return L.divIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: 'custom-cluster-marker',
    iconSize: L.point(36, 36, true),
  });
};

const statusIcons = {
  'Healthy': createTreeIcon('#10b981'), 
  'Needs Attention': createTreeIcon('#f59e0b'), 
  'Diseased': createTreeIcon('#ef4444') 
};

const provinceViews = {
  'All': { center: [11.8, 120.5], zoom: 6 },
  'Oriental Mindoro': { center: [13.0075, 121.2463], zoom: 9 },
  'Occidental Mindoro': { center: [13.0453, 120.8407], zoom: 9 },
  'Marinduque': { center: [13.4005, 121.9866], zoom: 10 },
  'Romblon': { center: [12.5768, 122.2694], zoom: 9 },
  'Palawan': { center: [9.8349, 118.7384], zoom: 7 }
};

const MapController = ({ selectedProvince }) => {
  const map = useMap();
  useEffect(() => {
    const view = provinceViews[selectedProvince] || provinceViews['All'];
    map.flyTo(view.center, view.zoom, { duration: 1.2, easeLinearity: 0.25 });
    setTimeout(() => map.invalidateSize(), 400);
  }, [selectedProvince, map]);
  return null; 
};

const MapView = () => {
  const [trees, setTrees] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('All');

  const provinces = ['All', 'Oriental Mindoro', 'Occidental Mindoro', 'Marinduque', 'Romblon', 'Palawan'];

  useEffect(() => {
    const fetchAllMapData = async () => {
      try {
        const treeRes = await treeApi.getAll();
        setTrees(treeRes.data.data || []);
      } catch (error) {
        console.error("Failed to fetch map data:", error);
      }
    };
    fetchAllMapData();
  }, []);

  const filteredTrees = trees.filter(t => selectedProvince === 'All' || t.province === selectedProvince);

  // --- CLUSTER BY ENTERPRISE LOGIC ---
  const groupedByEnterprise = filteredTrees.reduce((acc, tree) => {
    const entName = tree.enterprises?.name || 'Independent Farms';
    if (!acc[entName]) acc[entName] = [];
    acc[entName].push(tree);
    return acc;
  }, {});

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col font-sans">
      <style>{mapStyles}</style>

      {/* --- HEADER --- */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Geospatial Map</h1>
          <p className="text-sm text-gray-500 mt-1">Explore clustered inventory data across MIMAROPA.</p>
        </div>
      </div>

      {/* --- FILTER ROW --- */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <span className="text-sm font-bold text-gray-500 flex items-center mr-2 uppercase tracking-wider text-xs">Filter Region:</span>
        {provinces.map((prov) => (
          <button
            key={prov}
            onClick={() => setSelectedProvince(prov)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedProvince === prov 
                ? 'bg-green-700 text-white shadow-md scale-105' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {prov}
          </button>
        ))}
      </div>

      {/* --- MAP CONTAINER --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        <MapContainer 
          center={provinceViews['All'].center} 
          zoom={provinceViews['All'].zoom} 
          style={{ height: '600px', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" className="text-green-600 hover:underline">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController selectedProvince={selectedProvince} />
          
          {Object.entries(groupedByEnterprise).map(([enterpriseName, enterpriseTrees]) => (
            <MarkerClusterGroup 
              key={enterpriseName}
              chunkedLoading
              iconCreateFunction={createClusterIcon}
              maxClusterRadius={60}
            >
              {enterpriseTrees.map((marker) => (
                <Marker key={`tree-${marker.id}`} position={[marker.latitude, marker.longitude]} icon={statusIcons[marker.health_status] || statusIcons['Healthy']}>
                  <Popup>
                    
                    {/* --- COMPACT FULL-DATA POPUP CARD --- */}
                    <div className="bg-white p-4">
                      
                      {/* Header row with tiny image/icon and title */}
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                        {marker.image_url ? (
                          <img src={marker.image_url} alt="Tree" className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-lg border border-green-100 shrink-0">🌳</div>
                        )}
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{marker.common_name}</h3>
                          <p className="text-[10px] text-gray-500 italic truncate">{marker.species}</p>
                        </div>
                      </div>

                      {/* Primary Stats: Enterprise & Health */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Enterprise</span>
                          <span className="font-bold text-blue-600 truncate max-w-[120px]" title={enterpriseName}>{enterpriseName}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Health</span>
                          <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            marker.health_status === 'Healthy' ? 'bg-green-50 text-green-700' :
                            marker.health_status === 'Diseased' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {marker.health_status}
                          </span>
                        </div>
                      </div>

                      {/* Tightly Packed Detail Grid */}
                      <div className="grid grid-cols-2 gap-y-2 gap-x-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Quantity</p>
                          <p className="text-xs font-black text-green-700 leading-none">{marker.quantity ? marker.quantity.toLocaleString() : '1'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Area</p>
                          <p className="text-xs font-semibold text-gray-800 leading-none">{marker.hectares ? `${marker.hectares} Ha` : 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Location</p>
                          <p className="text-xs font-semibold text-gray-800 leading-none truncate">{marker.barangay}, {marker.municipality}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Planted</p>
                          <p className="text-xs font-semibold text-gray-800 leading-none">
                            {marker.date_planted ? new Date(marker.date_planted).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Age</p>
                          <p className="text-xs font-semibold text-gray-800 leading-none">{marker.age ? `${marker.age} Yrs` : 'N/A'}</p>
                        </div>
                      </div>

                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;