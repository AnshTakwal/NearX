import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Loader2, Upload } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStoreByOwner } from '../../api/stores';
import { getProductsByStore, addProduct, updateProduct, deleteProduct, calcDiscountFromExpiry } from '../../api/products';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/shared/Toast';

export default function ProductManagementPage() {
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  
  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '', brand: '', category: 'Grocery', mrp: '', stock: '', expiry_date: '', image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewDiscount, setPreviewDiscount] = useState(10);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const storeData = await getStoreByOwner(user.id);
        setStore(storeData);
        if (storeData) {
          const prods = await getProductsByStore(storeData.id);
          setProducts(prods);
        }
      } catch (err) {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  useEffect(() => {
    if (form.expiry_date) {
      setPreviewDiscount(calcDiscountFromExpiry(form.expiry_date));
    }
  }, [form.expiry_date]);

  const resetForm = () => {
    setForm({ name: '', brand: '', category: 'Grocery', mrp: '', stock: '', expiry_date: '', image_url: '' });
    setImageFile(null);
    setEditId(null);
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      brand: p.brand || '',
      category: p.category,
      mrp: p.mrp / 100, // Convert to rupees for input
      stock: p.stock,
      expiry_date: p.expiry_date,
      image_url: p.image_url || ''
    });
    setEditId(p.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      toast.success("Product deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalImageUrl = form.image_url;

      // Handle Image Upload
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      }

      const productData = {
        store_id: store.id,
        name: form.name,
        brand: form.brand,
        category: form.category,
        mrp: Math.round(Number(form.mrp) * 100), // Convert to paise
        stock: Number(form.stock),
        expiry_date: form.expiry_date,
        image_url: finalImageUrl,
        discount_percent: previewDiscount,
        sale_price: Math.round((Number(form.mrp) * 100) * (1 - previewDiscount / 100))
      };

      if (editId) {
        const updated = await updateProduct(editId, productData);
        setProducts(products.map(p => p.id === editId ? updated : p));
        toast.success("Product updated");
      } else {
        const added = await addProduct(productData);
        setProducts([...products, added]);
        toast.success("Product added");
      }
      
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#00BCD4] w-10 h-10" /></div>;
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#FAFEFF] min-h-screen px-6 md:px-16 lg:px-24 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A2E]">Inventory</h1>
          <p className="text-slate-500 mt-1">Manage your near-expiry products</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent transition-all"
            />
          </div>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#00BCD4] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-[#0097A7] transition-colors whitespace-nowrap"
          >
            <Plus size={18} /> Add New
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">MRP</th>
                <th className="p-4 font-medium">Expires On</th>
                <th className="p-4 font-medium">Discount</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No products found. Start adding inventory!</td>
                </tr>
              )}
              {filteredProducts.map((p) => {
                const daysToExpiry = Math.ceil((new Date(p.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                let statusColor = "bg-[#E8F5E9] text-[#22C55E]";
                if (daysToExpiry < 7) statusColor = "bg-[#FEF2F2] text-[#EF4444]";
                else if (daysToExpiry <= 15) statusColor = "bg-[#FFFBEB] text-[#F59E0B]";

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img src={p.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e"} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-slate-50 border" />
                      <div>
                        <p className="font-semibold text-[#1A1A2E]">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.category}</p>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">₹{(p.mrp / 100).toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span>{new Date(p.expiry_date).toLocaleDateString()}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold w-fit mt-1 ${statusColor}`}>
                          {daysToExpiry > 0 ? `${daysToExpiry} Days Left` : 'Expired'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-[#00BCD4]">{p.discount_percent}% OFF</td>
                    <td className="p-4 text-slate-600">
                      <span className={p.stock === 0 ? "text-red-500 font-bold" : ""}>{p.stock}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-[#00BCD4] transition-colors rounded-lg hover:bg-[#E0F7FA]"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-[#EF4444] transition-colors rounded-lg hover:bg-[#FEF2F2]"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A2E]/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product Name</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00BCD4] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brand</label>
                  <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00BCD4] outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00BCD4] outline-none bg-white">
                    {["Dairy", "Bakery", "Snacks", "Beverages", "Pantry", "Cleaning", "Grocery"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                  <input required type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00BCD4] outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">MRP (₹)</label>
                  <input required type="number" min="1" step="0.01" value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00BCD4] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <input required type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00BCD4] outline-none" />
                  {form.expiry_date && (
                    <p className="text-xs mt-1 text-[#00BCD4] font-medium">Auto-calculated discount: {previewDiscount}% OFF</p>
                  )}
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Product Image</label>
                  <div className="flex items-center gap-4">
                    {imageFile ? (
                      <p className="text-sm text-green-600 truncate flex-1">{imageFile.name}</p>
                    ) : form.image_url ? (
                      <img src={form.image_url} alt="Preview" className="w-16 h-16 rounded object-cover border" />
                    ) : null}
                    <label className="flex-1 cursor-pointer bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-100 transition-colors">
                      <Upload size={20} className="text-slate-400 mb-1" />
                      <span className="text-sm text-slate-500">Click to upload image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files[0])} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-[#00BCD4] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#0097A7] flex items-center gap-2 transition-colors disabled:opacity-70">
                  {submitting && <Loader2 size={16} className="animate-spin" />} Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
