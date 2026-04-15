const supabase = require('../config/supabase');

const userModel = {
  // Fetch all user profiles (useful for the Admin dashboard)
  getAllProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Fetch a single profile by their secure Auth ID
  getProfileById: async (id) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // Update a user's role or details (e.g., changing viewer to admin)
  updateProfile: async (id, updateData) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  }
};

module.exports = userModel;