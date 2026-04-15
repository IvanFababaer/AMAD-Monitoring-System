const supabase = require('../config/supabase');

const enterpriseModel = {
  getAll: async () => {
    const { data, error } = await supabase.from('enterprises').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  create: async (enterpriseData) => {
    const { data, error } = await supabase.from('enterprises').insert([enterpriseData]).select();
    if (error) throw error;
    return data;
  },

  update: async (id, enterpriseData) => {
    const { data, error } = await supabase.from('enterprises').update(enterpriseData).eq('id', id).select();
    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { data, error } = await supabase.from('enterprises').delete().eq('id', id);
    if (error) throw error;
    return data;
  }
};

module.exports = enterpriseModel;