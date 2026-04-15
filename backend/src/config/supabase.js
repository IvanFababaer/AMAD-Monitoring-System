const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // This loads your .env file

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in backend .env file!");
}

// Create the official client
const supabase = createClient(supabaseUrl, supabaseKey);

// IMPORTANT: Export it directly so treeModel.js can use supabase.from()
module.exports = supabase;