const supabase = require('../config/supabase');

const treeModel = {
  // 1. Fetch all trees (with their Enterprise names)
  getAllTrees: async () => {
    const { data, error } = await supabase
      .from('trees')
      .select('*, enterprises(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  // 2. Fetch specific data for the map
  getMapMarkers: async (province) => {
    let query = supabase.from('trees').select('id, latitude, longitude, health_status, province, municipality, common_name, species');
    if (province && province !== 'All') {
      query = query.eq('province', province);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // 3. Add a new tree
  createTree: async (treeData) => {
    const { data, error } = await supabase.from('trees').insert([treeData]).select();
    if (error) throw error;
    return data;
  },

  // 4. Update an existing tree
  updateTree: async (id, treeData) => {
    const { data, error } = await supabase.from('trees').update(treeData).eq('id', id).select();
    if (error) throw error;
    return data;
  },

  // 5. Delete a tree
  deleteTree: async (id) => {
    const { data, error } = await supabase.from('trees').delete().eq('id', id);
    if (error) throw error;
    return data;
  }
};

module.exports = treeModel;