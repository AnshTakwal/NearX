import React, { useState, useEffect } from 'react';
import { MapPin, CreditCard, Bell, LogOut, Settings, Plus, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAddresses, addAddress, deleteAddress, setDefaultAddress } from '../../api/addresses';
import { toast } from '../../components/shared/Toast';

export default function CustomerProfile() {
  const { profile, logout } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: '', address_line: '', city: '', pincode: '' });

  useEffect(() => {
    async function load() {
      if (!profile?.id) return;
      try {
        const data = await getAddresses(profile.id);
        setAddresses(data);
      } catch (err) {
        toast.error('Failed to load addresses');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const added = await addAddress({ ...newAddr, user_id: profile.id, is_default: addresses.length === 0 });
      setAddresses([...addresses, added]);
      setShowAdd(false);
      setNewAddr({ label: '', address_line: '', city: '', pincode: '' });
      toast.success('Address added');
    } catch (err) {
      toast.error('Failed to add address');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id);
      setAddresses(addresses.filter(a => a.id !== id));
      toast.success('Address removed');
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
    <div className="bg-[#FAFEFF] min-h-screen px-6 md:px-16 lg:px-24 py-8 pb-24 md:pb-8">
      <h1 className="text-3xl font-bold text-[#1A1A2E] mb-8">Profile</h1>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-20 h-20 bg-[#E0F7FA] rounded-full flex items-center justify-center text-[#00BCD4] text-3xl font-bold uppercase">
            {profile.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-1">{profile.full_name}</h2>
            <p className="text-slate-500">{profile.phone || 'No phone number added'}</p>
          </div>
        </div>

        {/* Addresses Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2"><MapPin size={20} className="text-[#00BCD4]" /> Saved Addresses</h3>
            <button onClick={() => setShowAdd(!showAdd)} className="text-[#00BCD4] font-medium flex items-center gap-1 hover:underline">
               <Plus size={16} /> Add New
            </button>
          </div>

          {showAdd && (
            <form onSubmit={handleAdd} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input required placeholder="Label (e.g. Home, Office)" value={newAddr.label} onChange={e => setNewAddr({...newAddr, label: e.target.value})} className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#00BCD4]" />
                <input required placeholder="Full Address" value={newAddr.address_line} onChange={e => setNewAddr({...newAddr, address_line: e.target.value})} className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#00BCD4]" />
                <input required placeholder="City" value={newAddr.city} onChange={e => setNewAddr({...newAddr, city: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#00BCD4]" />
                <input required placeholder="Pincode" value={newAddr.pincode} onChange={e => setNewAddr({...newAddr, pincode: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#00BCD4]" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                <button type="submit" className="bg-[#00BCD4] text-white px-4 py-2 rounded-lg font-medium">Save</button>
              </div>
            </form>
          )}

          {loading ? (
             <div className="flex justify-center py-4"><Loader2 className="animate-spin text-[#00BCD4]" /></div>
          ) : addresses.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No addresses saved yet.</p>
          ) : (
            <div className="space-y-4">
              {addresses.map(addr => (
                <div key={addr.id} className={`p-4 rounded-xl border flex justify-between items-start ${addr.is_default ? 'border-[#00BCD4] bg-[#E0F7FA]/30' : 'border-slate-100 bg-white'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[#1A1A2E]">{addr.label}</span>
                      {addr.is_default && <span className="text-[10px] bg-[#00BCD4] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Default</span>}
                    </div>
                    <p className="text-sm text-slate-600">{addr.address_line}</p>
                    <p className="text-sm text-slate-500">{addr.city}, {addr.pincode}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {!addr.is_default && (
                      <button onClick={() => handleSetDefault(addr.id)} className="text-sm text-[#00BCD4] hover:underline font-medium">Make Default</button>
                    )}
                    <button onClick={() => handleDelete(addr.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-4 text-[#EF4444] font-semibold hover:bg-[#FEF2F2] rounded-xl transition-colors border border-transparent hover:border-red-100">
          <LogOut size={20} /> Log Out
        </button>
      </div>
    </div>
  );
}
