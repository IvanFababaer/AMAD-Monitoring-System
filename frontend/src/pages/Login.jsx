import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api'; 
import { Eye, EyeOff, Leaf } from 'lucide-react'; 

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false); 
  const [formData, setFormData] = useState({ username: '', password: '', firstName: '', lastName: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        await authApi.signUp({
          email: formData.username,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
        setSuccess('Account created successfully! You can now sign in.');
        setIsSignUp(false); 
        setFormData({ username: formData.username, password: '', firstName: '', lastName: '' });
      } else {
        const result = await authApi.login({
          email: formData.username,
          password: formData.password
        });
        if (result.session) {
          localStorage.setItem('token', result.session.access_token);
          const fullName = result.profile ? `${result.profile.first_name} ${result.profile.last_name}` : 'System Admin';
          const userRole = result.profile?.role || 'admin';
          const userPhoto = result.profile?.photo || ''; 

          localStorage.setItem('user', JSON.stringify({
            email: result.user.email,
            name: fullName,
            role: userRole,
            photo: userPhoto,
            id: result.user.id
          }));
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      
      {/* --- LEFT PANEL: Branding & Image (Desktop) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-green-950 overflow-hidden">
        {/* Background Tree Image */}
        <img 
          src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop" 
          alt="Lush forest canopy" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        {/* Deep Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-950 via-green-900/80 to-green-900/20"></div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full h-full">
          {/* Top: Logo Holder */}
          <div className="flex items-center gap-6">
            <div className="bg-white/10 p-1.5 rounded-full backdrop-blur-md shadow-2xl flex items-center justify-center h-24 w-24 border border-white/20 overflow-hidden relative">
              <img src="/logo.jpg" alt="AMAD Logo" className="h-full w-full object-cover rounded-full bg-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">AMAD</h1>
              <p className="text-green-300 text-sm font-bold uppercase tracking-widest mt-1.5">Monitoring System</p>
            </div>
          </div>

          {/* Bottom: Information */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-lg">
              <Leaf className="h-4 w-4 text-green-300" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">MIMAROPA Region</span>
            </div>
            <h2 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] mb-6">
              Track every root,<br/>grow our future.
            </h2>
            <p className="text-green-100/80 text-lg max-w-md font-medium leading-relaxed">
              A centralized platform to manage, monitor, and analyze regional tree inventories and agricultural enterprises.
            </p>
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL: Modern Form with Bright Green Ambient Glow --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 py-12 sm:px-10 lg:px-16 bg-white relative overflow-hidden">
        
        {/* CHANGED: Vibrant, Bright Green Aurora Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-400/40 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-lime-400/40 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none"></div>
        <div className="absolute top-[30%] left-[10%] w-[400px] h-[400px] bg-emerald-400/30 rounded-full mix-blend-multiply filter blur-[150px] pointer-events-none"></div>


        {/* Mobile Header Logo */}
        <div className="lg:hidden flex flex-col items-center mb-10 relative z-10">
          <div className="bg-white p-1.5 rounded-full shadow-xl mb-6 border border-gray-100 h-28 w-28 flex items-center justify-center relative overflow-hidden">
            <img src="/logo.jpg" alt="AMAD Logo" className="h-full w-full object-cover rounded-full" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">AMAD System</h2>
          <p className="text-sm text-green-600 font-bold uppercase tracking-widest mt-2">MIMAROPA Inventory</p>
        </div>

        {/* Form Container - Modern Floating Card */}
        <div className="w-full max-w-md mx-auto relative z-10 bg-white/80 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-green-900/5 border border-white backdrop-blur-sm">
          
          <div className="mb-10">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              {isSignUp ? 'Create account' : 'Welcome back'}
            </h3>
            <p className="text-gray-500 mt-2 text-sm font-medium">
              {isSignUp ? 'Fill in your details to access the system.' : 'Enter your credentials to securely access your dashboard.'}
            </p>
          </div>
          
          <form className="space-y-5" onSubmit={handleAuth}>
            {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-bold px-4 py-3 rounded-xl">{error}</div>}
            {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold px-4 py-3 rounded-xl">{success}</div>}

            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">First Name</label>
                  <input
                    name="firstName" type="text" required={isSignUp} value={formData.firstName} onChange={handleInputChange}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-gray-900 font-semibold"
                    
                  />
                </div>
                <div className="group">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Last Name</label>
                  <input
                    name="lastName" type="text" required={isSignUp} value={formData.lastName} onChange={handleInputChange}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-gray-900 font-semibold"
                    
                  />
                </div>
              </div>
            )}

            <div className="group">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input
                name="username" type="email" required value={formData.username} onChange={handleInputChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-gray-900 font-semibold"
                
              />
            </div>

            <div className="group">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative">
                <input
                  name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleInputChange}
                  className="w-full px-4 py-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-gray-900 font-semibold"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors focus:outline-none">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit" disabled={isLoading}
                className={`w-full flex justify-center items-center py-4 px-6 rounded-2xl shadow-lg shadow-green-600/30 text-sm font-bold tracking-wide text-white bg-green-600 hover:bg-green-700 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5 active:translate-y-0'}`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Authenticating...
                  </span>
                ) : ( isSignUp ? 'Create Admin Account' : 'Sign in to Dashboard' )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 font-medium">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); setShowPassword(false); }} 
                className="font-bold text-green-600 hover:text-green-700 hover:underline focus:outline-none transition-colors ml-1"
              >
                {isSignUp ? 'Sign in here' : 'Register now'}
              </button>
            </p>
          </div>
          
        </div>
        
        {/* Subtle footer link on right side */}
        <p className="absolute bottom-6 left-0 right-0 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest z-10">
          Secure System Access
        </p>
      </div>
    </div>
  );
};

export default Login;