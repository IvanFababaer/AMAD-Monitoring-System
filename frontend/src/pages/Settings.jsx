import React, { useState, useEffect, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { authApi } from '../services/api';

// --- HELPER FUNCTION: Extracts the cropped area using an HTML5 Canvas ---
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.9);
};

const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('identity');

  const fileInputRef = useRef(null);

  // --- CROPPER STATES ---
  const [selectedImage, setSelectedImage] = useState(null); 
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // --- FORM STATES ---
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'System Admin',
    photo: '' 
  });

  const [security, setSecurity] = useState({ newPassword: '', confirmPassword: '' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const nameParts = (parsedUser.name || '').split(' ');
      const fName = nameParts[0] || '';
      const lName = nameParts.slice(1).join(' ') || '';

      setProfile({
        firstName: fName,
        lastName: lName,
        email: parsedUser.email || '',
        role: parsedUser.role || 'System Admin',
        photo: parsedUser.photo || '' 
      });
    }
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // --- IMAGE UPLOAD & CROP HANDLERS ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        return showNotification('Image must be less than 5MB.', 'error');
      }

      const reader = new FileReader();
      reader.onload = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
      e.target.value = null; 
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    try {
      const croppedImageBase64 = await getCroppedImg(selectedImage, croppedAreaPixels);
      setProfile(prev => ({ ...prev, photo: croppedImageBase64 }));
      setSelectedImage(null);
    } catch (e) {
      console.error(e);
      showNotification('Failed to crop image.', 'error');
    }
  };

  // --- FORM SUBMIT HANDLERS ---
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Get the current user ID
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser || !storedUser.id) throw new Error("User session not found.");

      // 2. Save the changes to the Supabase Database permanently!
      await authApi.updateProfile(storedUser.id, {
        first_name: profile.firstName,
        last_name: profile.lastName,
        photo: profile.photo 
      });
      
      // 3. Update localStorage
      storedUser.name = `${profile.firstName} ${profile.lastName}`.trim();
      storedUser.photo = profile.photo; 
      localStorage.setItem('user', JSON.stringify(storedUser));
      
      // 4. Shout to the Header that the profile updated!
      window.dispatchEvent(new Event('profileUpdated'));
      
      showNotification('Profile permanently updated!');
    } catch (error) {
      console.error(error);
      showNotification('Failed to update profile in database.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- REAL PASSWORD UPDATE HANDLER ---
  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (security.newPassword !== security.confirmPassword) {
      return showNotification('Passwords do not match!', 'error');
    }
    if (security.newPassword.length < 6) {
      return showNotification('Password must be at least 6 characters.', 'error');
    }

    setIsLoading(true);
    try {
      // Calls Supabase to update the active user's password
      await authApi.updatePassword(security.newPassword);
      
      showNotification('Password updated securely!');
      setSecurity({ newPassword: '', confirmPassword: '' }); // Clear fields on success
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to update password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getTabClass = (tabName) => activeTab === tabName
      ? "w-full flex items-center justify-between px-4 py-3 bg-white border border-green-200 border-l-4 border-l-green-600 rounded-lg shadow-sm text-sm font-bold text-green-800 transition-all"
      : "w-full flex items-center justify-between px-4 py-3 bg-transparent hover:bg-white border border-transparent hover:border-gray-200 rounded-lg text-sm font-medium text-gray-600 transition-all";

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      
      {/* Toast Notification */}
      {notification.show && (
        <div className={`absolute top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-xl font-bold text-sm transform transition-all ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* --- CROPPER MODAL --- */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Crop Avatar</h3>
              <button onClick={() => setSelectedImage(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="relative w-full h-80 bg-gray-900">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button onClick={() => setSelectedImage(null)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSaveCrop} className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md transition-colors">Apply Crop</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-green-900">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your administrative identity and security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Settings Navigation */}
        <div className="col-span-1 space-y-2">
          <button onClick={() => setActiveTab('identity')} className={getTabClass('identity')}>
            Administrative Identity
            {activeTab === 'identity' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>}
          </button>
          <button onClick={() => setActiveTab('security')} className={getTabClass('security')}>
            Security & Passwords
            {activeTab === 'security' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>}
          </button>
        </div>

        {/* Right Column: Dynamic Form Area */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* --- TAB 1: IDENTITY --- */}
            {activeTab === 'identity' && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-lg font-bold text-gray-900">Administrative Identity</h3>
                  <p className="text-xs text-gray-500 mt-1">Update your personal details and public profile.</p>
                </div>
                <div className="p-6">
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className="h-20 w-20 rounded-2xl bg-green-100 border-2 border-green-200 flex items-center justify-center text-green-700 font-black text-3xl shadow-sm overflow-hidden relative group">
                      {profile.photo ? (
                        <img src={profile.photo} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        profile.firstName ? profile.firstName.charAt(0) : 'A'
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current.click()} 
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        Change Avatar
                      </button>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium">JPG or PNG. 5MB max.</p>
                    </div>
                  </div>

                  <form id="profile-form" onSubmit={handleProfileSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">First Name</label>
                        <input type="text" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-green-500 outline-none text-gray-800 font-medium" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Last Name</label>
                        <input type="text" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-green-500 outline-none text-gray-800 font-medium" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Email Address (Login ID)</label>
                      <input type="email" disabled value={profile.email} className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-gray-500 font-medium cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">System Role</label>
                      <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        {profile.role}
                      </div>
                    </div>
                  </form>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                  <button type="submit" form="profile-form" disabled={isLoading} className={`px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all ${isLoading ? 'opacity-70' : 'active:scale-95'}`}>
                    {isLoading ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </>
            )}

            {/* --- TAB 2: SECURITY & PASSWORDS --- */}
            {activeTab === 'security' && (
               <>
               <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                 <h3 className="text-lg font-bold text-gray-900">Security & Passwords</h3>
                 <p className="text-xs text-gray-500 mt-1">Ensure your account uses a long, random password.</p>
               </div>
               <div className="p-6">
                 <form id="security-form" onSubmit={handleSecuritySubmit} className="space-y-5">
                   <div>
                     <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">New Password</label>
                     <input 
                       type="password" 
                       required
                       value={security.newPassword} 
                       onChange={(e) => setSecurity({...security, newPassword: e.target.value})} 
                       placeholder="••••••••"
                       className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-green-500 outline-none text-gray-800" 
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Confirm New Password</label>
                     <input 
                       type="password" 
                       required
                       value={security.confirmPassword} 
                       onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})} 
                       placeholder="••••••••"
                       className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-green-500 outline-none text-gray-800" 
                     />
                   </div>
                 </form>
               </div>
               <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                 <button type="submit" form="security-form" disabled={isLoading} className={`px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all ${isLoading ? 'opacity-70' : 'active:scale-95'}`}>
                   {isLoading ? 'Updating...' : 'Update Password'}
                 </button>
               </div>
             </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;