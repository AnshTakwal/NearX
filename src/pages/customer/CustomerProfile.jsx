import React, { useState, useEffect } from 'react';
import { MapPin, LogOut, Plus, Trash2, Loader2, Camera, User, Phone, Lock, Check, KeyRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAddresses, addAddress, deleteAddress, setDefaultAddress } from '../../api/addresses';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/shared/Toast';

export default function CustomerProfile() {
  const { profile, user, logout, refreshProfile } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: '', address_line: '', city: '', pincode: '' });

  // Avatar State
  const [uploading, setUploading] = useState(false);

  // Profile fields State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password fields State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    async function load() {
      if (!profile?.id) return;
      try {
        const data = await getAddresses(profile.id);
        setAddresses(data);
      } catch (err) {
        toast.error('Failed to load addresses');
      } finally {
        setLoadingAddresses(false);
      }
    }
    load();
  }, [profile]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (e.g. 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${profile.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      toast.success('Profile picture updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: name.trim(), 
          phone: phone.trim() || null 
        })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      toast.success('Profile details updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const added = await addAddress({ ...newAddr, user_id: profile.id, is_default: addresses.length === 0 });
      setAddresses([...addresses, added]);
      setShowAdd(false);
      setNewAddr({ label: '', address_line: '', city: '', pincode: '' });
      toast.success('Address saved successfully');
    } catch (err) {
      toast.error('Failed to add address');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id);
      setAddresses(addresses.filter(a => a.id !== id));
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to remove address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id, profile.id);
      setAddresses(addresses.map(a => ({ ...a, is_default: a.id === id })));
      toast.success('Default address updated');
    } catch (err) {
      toast.error('Failed to update default address');
    }
  };

  if (!profile) return null;

  return (
    <div className="bg-[#FAFEFF] min-h-screen px-6 md:px-16 lg:px-24 py-8 pb-24 md:pb-8 text-[#1A1A2E]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Account settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100/80 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-[#E0F7FA] to-[#00BCD4]/20 -z-10"></div>
              
              {/* Profile Image & Upload */}
              <div className="relative mt-8 group mb-4">
                <div className="w-28 h-28 bg-[#E0F7FA] rounded-full border-4 border-white shadow-md flex items-center justify-center overflow-hidden relative">
                  {uploading ? (
                    <Loader2 size={32} className="animate-spin text-[#00BCD4]" />
                  ) : profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#00BCD4] text-4xl font-extrabold uppercase">
                      {profile.full_name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-1 right-1 bg-[#00BCD4] hover:bg-[#0097A7] text-white p-2.5 rounded-full shadow-md cursor-pointer transition-colors active:scale-90 flex items-center justify-center border border-white">
                  <Camera size={16} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>

              <h2 className="text-xl font-bold">{profile.full_name}</h2>
              <span className="inline-block px-3 py-1 rounded-full bg-[#E0F7FA] text-[#0097A7] text-xs font-bold uppercase tracking-wider mt-2.5">
                {profile.role.replace('_', ' ')}
              </span>

              <div className="w-full border-t border-slate-50 mt-6 pt-5 text-left space-y-3">
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-medium text-slate-700">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Phone Number</p>
                  <p className="text-sm font-medium text-slate-700">{profile.phone || 'No phone added'}</p>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100/80">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#1A1A2E]">
                <KeyRound size={20} className="text-[#00BCD4]" />
                <span>Change Password</span>
              </h3>

              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="w-full bg-[#00BCD4] hover:bg-[#0097A7] text-white py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {updatingPassword ? (
                    <><Loader2 size={16} className="animate-spin" /> Updating...</>
                  ) : 'Update Password'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Profile details & Saved Addresses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Profile Form */}
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100/80">
              <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                <User size={22} className="text-[#00BCD4]" />
                <span>Profile Details</span>
              </h3>

              <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all"
                      placeholder="Your Name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="bg-[#00BCD4] hover:bg-[#0097A7] text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2 text-sm disabled:opacity-60"
                  >
                    {updatingProfile ? (
                      <><Loader2 size={16} className="animate-spin" /> Saving...</>
                    ) : (
                      <><Check size={16} /> Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Saved Addresses Panel */}
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100/80">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold flex items-center gap-2">
                  <MapPin size={22} className="text-[#00BCD4]" />
                  <span>Saved Addresses</span>
                </h3>
                <button
                  onClick={() => setShowAdd(!showAdd)}
                  className="bg-[#E0F7FA] text-[#0097A7] hover:bg-[#00BCD4] hover:text-white px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus size={14} /> Add New
                </button>
              </div>

              {showAdd && (
                <form onSubmit={handleAdd} className="mb-6 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Label</label>
                      <input
                        required
                        placeholder="e.g. Home, Office, Gym"
                        value={newAddr.label}
                        onChange={e => setNewAddr({...newAddr, label: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00BCD4] text-sm font-medium"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Address Line</label>
                      <input
                        required
                        placeholder="House/Flat No, Street, Landmark"
                        value={newAddr.address_line}
                        onChange={e => setNewAddr({...newAddr, address_line: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00BCD4] text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">City</label>
                      <input
                        required
                        placeholder="Delhi"
                        value={newAddr.city}
                        onChange={e => setNewAddr({...newAddr, city: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00BCD4] text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Pincode</label>
                      <input
                        required
                        placeholder="110001"
                        value={newAddr.pincode}
                        onChange={e => setNewAddr({...newAddr, pincode: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00BCD4] text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm">Cancel</button>
                    <button type="submit" className="bg-[#00BCD4] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#0097A7] transition-colors text-sm shadow-sm active:scale-95">Save Address</button>
                  </div>
                </form>
              )}

              {loadingAddresses ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-[#00BCD4]" /></div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-400 font-semibold text-sm">No addresses saved yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div key={addr.id} className={`p-5 rounded-2xl border flex flex-col justify-between ${addr.is_default ? 'border-[#00BCD4] bg-[#E0F7FA]/10' : 'border-slate-100 bg-white'} relative transition-all shadow-sm hover:shadow`}>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-extrabold text-[#1A1A2E] text-md">{addr.label}</span>
                          {addr.is_default && <span className="text-[9px] bg-[#00BCD4] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Default</span>}
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-1">{addr.address_line}</p>
                        <p className="text-xs text-slate-400 font-semibold">{addr.city}, {addr.pincode}</p>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-50 mt-4 pt-3">
                        {!addr.is_default ? (
                          <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-[#00BCD4] hover:text-[#0097A7] font-bold transition-colors">Set Default</button>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold">Active Address</span>
                        )}
                        <button onClick={() => handleDelete(addr.id)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout Panel */}
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-4 text-[#EF4444] font-bold hover:bg-[#FEF2F2] rounded-3xl transition-all border border-transparent hover:border-red-100 shadow-sm bg-white">
              <LogOut size={20} /> Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
