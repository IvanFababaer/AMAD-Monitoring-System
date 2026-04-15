const supabase = require('../config/supabase');

const authModel = {
  // Register a new user
  signUpUser: async (email, password, firstName, lastName) => {
    // 1. Create the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;

    // 2. Supabase triggers usually handle profile creation, 
    // but you can also manually insert into the profiles table here if needed.
    if (data.user) {
      await supabase.from('profiles').insert([
        { id: data.user.id, first_name: firstName, last_name: lastName, role: 'viewer' }
      ]);
    }

    return data;
  },

  // Log in an existing user
  signInUser: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Log out a user
  signOutUser: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  }
};

module.exports = authModel;