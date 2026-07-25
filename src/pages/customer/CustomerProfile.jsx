import React, { useState, useEffect } from 'react';
import { MapPin, LogOut, Plus, Trash2, Loader2, User, Phone, Lock, Check, KeyRound, Package, ChevronRight, LayoutDashboard, Store } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { useOrders } from '../../hooks/useOrders';
import { getAddresses, addAddress, deleteAddress, setDefaultAddress } from '../../api/addresses';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/shared/Toast';

function formatItemNames(items = [], max = 2) {
  if (!items || items.length === 0) return 'No items';
  const names = items.map(i => i.product_name).filter(Boolean);
  if (names.length === 0) return `${items.length} items`;
  if (names.length <= max) return names.join(', ');
  return `${names.slice(0, max).join(', ')}, +${names.length - max} more`;
}

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'account',  label: 'Manage Account',  icon: LayoutDashboard },
  { id: 'orders',   label: 'My Orders',        icon: Package },
  { id: 'password', label: 'Change Password',  icon: KeyRound },
];

export default function CustomerProfile() {
  const { profile, user, logout, refreshProfile } = useAuth();
  const { orders, loading: ordersLoading } = useOrders();
  const [activeSection, setActiveSection] = useState('account');

  // Addresses
  const [addresses, setAddresses]               = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAdd, setShowAdd]                   = useState(false);
  const [newAddr, setNewAddr]                   = useState({ label: '', address_line: '', city: '', pincode: '' });

  // Profile edit
  const [name, setName]                   = useState('');
  const [phone, setPhone]                 = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password
  const [newPassword, setNewPassword]         = useState('');
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
      } catch {
        toast.error('Failed to load addresses');
      } finally {
        setLoadingAddresses(false);
      }
    }
    load();
  }, [profile]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim(), phone: phone.trim() || null })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
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
      toast.success('Address saved');
    } catch { toast.error('Failed to add address'); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id);
      setAddresses(addresses.filter(a => a.id !== id));
      toast.success('Address deleted');
    } catch { toast.error('Failed to remove address'); }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id, profile.id);
      setAddresses(addresses.map(a => ({ ...a, is_default: a.id === id })));
      toast.success('Default address updated');
    } catch { toast.error('Failed to update default'); }
  };

  const handleNavClick = (item) => {
    setActiveSection(item.id);
  };

  if (!profile) return null;

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-8 pb-24 md:pb-8 w-full flex flex-col items-center">
      <div className="container-premium w-full">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">My Account</h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Avatar + name header */}
              <div className="bg-gradient-to-br from-[#0097A7] to-[#00BCD4] p-6 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-white text-3xl font-bold uppercase">
                    {profile.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <p className="text-white font-bold text-lg leading-tight">{profile.full_name}</p>
                <p className="text-white/75 text-sm mt-0.5">{user?.email}</p>
                <span className="mt-2 inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider">
                  {profile.role.replace('_', ' ')}
                </span>
              </div>

              {/* Nav items */}
              <nav className="p-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id && !item.href;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all text-left group ${
                        isActive
                          ? 'bg-[#E0F7FA] text-[#0097A7]'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-[#0097A7]' : 'text-gray-400 group-hover:text-gray-600'} />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight size={15} className={`transition-transform ${isActive ? 'text-[#0097A7] translate-x-0.5' : 'text-gray-300'}`} />
                    </button>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="p-2 pt-0 border-t border-gray-100 mt-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all group"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* ── RIGHT CONTENT ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* ── MANAGE ACCOUNT ── */}
            {activeSection === 'account' && (
              <>
                {/* Account Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                    <User size={20} className="text-[#0097A7]" />
                    Account Details
                  </h2>

                  {/* Read-only info strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 p-5 bg-[#F7F8FA] rounded-xl border border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Full Name</p>
                      <p className="font-semibold text-gray-900">{profile.full_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Email</p>
                      <p className="font-semibold text-gray-900 truncate">{user?.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Phone</p>
                      <p className="font-semibold text-gray-900">{profile.phone || 'Not set'}</p>
                    </div>
                  </div>

                  {/* Edit form */}
                  <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Display Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          style={{ paddingLeft: '3rem' }}
                          className="input-premium h-[48px]"
                          placeholder="Your Name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          style={{ paddingLeft: '3rem' }}
                          className="input-premium h-[48px]"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={updatingProfile}
                        className="btn-primary py-3 px-8 rounded-xl text-sm"
                      >
                        {updatingProfile
                          ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                          : <><Check size={16} /> Save Changes</>}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Saved Addresses Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                      <MapPin size={20} className="text-[#0097A7]" />
                      Saved Addresses
                    </h2>
                    <button
                      onClick={() => setShowAdd(!showAdd)}
                      className="bg-[#E0F7FA] text-[#0097A7] hover:bg-[#0097A7] hover:text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Plus size={14} /> Add New
                    </button>
                  </div>

                  {showAdd && (
                    <form onSubmit={handleAdd} className="mb-6 bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Label</label>
                          <input required placeholder="e.g. Home, Office" value={newAddr.label}
                            onChange={e => setNewAddr({...newAddr, label: e.target.value})} className="input-premium h-[44px]" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Address Line</label>
                          <input required placeholder="House/Flat No, Street, Landmark" value={newAddr.address_line}
                            onChange={e => setNewAddr({...newAddr, address_line: e.target.value})} className="input-premium h-[44px]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">City</label>
                          <input required placeholder="Delhi" value={newAddr.city}
                            onChange={e => setNewAddr({...newAddr, city: e.target.value})} className="input-premium h-[44px]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Pincode</label>
                          <input required placeholder="110001" value={newAddr.pincode}
                            onChange={e => setNewAddr({...newAddr, pincode: e.target.value})} className="input-premium h-[44px]" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-1">
                        <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl text-sm transition-colors">Cancel</button>
                        <button type="submit" className="btn-primary py-3 px-8 rounded-xl text-sm">Save Address</button>
                      </div>
                    </form>
                  )}

                  {loadingAddresses ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#0097A7]" /></div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                      <MapPin size={32} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium text-sm">No addresses saved yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map(addr => (
                        <div key={addr.id} className={`p-5 rounded-xl border flex flex-col justify-between transition-all shadow-sm hover:shadow ${addr.is_default ? 'border-[#0097A7] bg-[#E0F7FA]/20' : 'border-gray-100 bg-white'}`}>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-gray-900">{addr.label}</span>
                              {addr.is_default && <span className="text-[9px] bg-[#0097A7] text-white px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">Default</span>}
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed mb-1">{addr.address_line}</p>
                            <p className="text-sm text-gray-400">{addr.city}, {addr.pincode}</p>
                          </div>
                          <div className="flex items-center justify-between border-t border-gray-100 mt-4 pt-3">
                            {!addr.is_default
                              ? <button onClick={() => handleSetDefault(addr.id)} className="text-sm text-[#0097A7] hover:text-[#00838F] font-semibold transition-colors">Set Default</button>
                              : <span className="text-sm text-gray-400">Active Address</span>}
                            <button onClick={() => handleDelete(addr.id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all"><Trash2 size={16}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── MY ORDERS ── */}
            {activeSection === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                  <Package size={20} className="text-[#0097A7]" />
                  My Orders
                </h2>

                {ordersLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#0097A7] w-8 h-8" /></div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center">
                    <Package size={36} className="text-gray-300 mb-3" />
                    <p className="text-gray-500 font-semibold mb-1">No orders yet</p>
                    <p className="text-gray-400 text-sm mb-5">When you place an order it will appear here.</p>
                    <Link to="/products" className="btn-primary px-6 py-3 rounded-xl text-sm inline-block">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => {
                      const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                      return (
                        <Link
                          key={order.id}
                          to={`/track/${order.id}`}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl border border-gray-100 hover:border-[#0097A7] hover:shadow-sm transition-all group bg-white"
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-[#E0F7FA] p-2.5 rounded-xl text-[#0097A7] shrink-0">
                              <Store size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-0.5">{order.stores?.name}</p>
                              <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                                <span>{date}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="truncate max-w-[200px]">{formatItemNames(order.order_items)}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="font-semibold text-gray-800">₹{(order.total / 100).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            order.status === 'delivered'        ? 'bg-green-50 text-green-600' :
                            order.status === 'out_for_delivery' ? 'bg-amber-50 text-amber-600' :
                            order.status === 'cancelled'        ? 'bg-red-50 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── CHANGE PASSWORD ── */}
            {activeSection === 'password' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                  <KeyRound size={20} className="text-[#0097A7]" />
                  Change Password
                </h2>
                <form onSubmit={handlePasswordUpdate} className="space-y-5 max-w-sm">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        style={{ paddingLeft: '2.5rem' }}
                        className="input-premium h-[48px]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        style={{ paddingLeft: '2.5rem' }}
                        className="input-premium h-[48px]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="w-full btn-primary py-4 rounded-xl text-sm"
                  >
                    {updatingPassword
                      ? <><Loader2 size={16} className="animate-spin" /> Updating...</>
                      : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
