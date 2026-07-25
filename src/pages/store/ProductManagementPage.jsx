import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Loader2, Upload, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getStoreByOwner } from '../../api/stores';
import { getProductsByStore, addProduct, updateProduct, deleteProduct, calcDiscountFromExpiry } from '../../api/products';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/shared/Toast';

export default function ProductManagementPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowModal(true);
    }
  }, [searchParams]);
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
      mrp: p.mrp / 100,
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
        mrp: Math.round(Number(form.mrp) * 100),
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
    return <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]"><Loader2 className="animate-spin text-[#0097A7] w-10 h-10" /></div>;
  }

  if (!store) {
    return (
      <div className="bg-[#F7F8FA] min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[400px] h-[400px] bg-[#0097A7]/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-6">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h2>
            <p className="text-gray-500 text-sm mb-6">You need to set up your store profile before you can manage products.</p>
            <a href="/store/dashboard" className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-2">
              Go to Dashboard Setup
            </a>
          </div>
        </div>
      </div>
    );
  }


  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-8 w-full flex flex-col items-center">
      <div className="container-premium">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your near-expiry products</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search inventory..." 
                style={{ paddingLeft: '2.5rem' }}
                className="input-premium w-full"
              />
            </div>
            <button 
              onClick={() => { resetForm(); setShowModal(true); }}
              className="btn-primary py-4 px-8 rounded-xl whitespace-nowrap"
            >
              <Plus size={16} /> Add New
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-premium min-w-[800px]">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>MRP</th>
                  <th>Expires On</th>
                  <th>Discount</th>
                  <th>Stock</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-gray-400 py-10">No products found. Start adding inventory!</td>
                  </tr>
                )}
                {filteredProducts.map((p) => {
                  const daysToExpiry = Math.ceil((new Date(p.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                  let statusColor = "bg-green-50 text-green-600";
                  if (daysToExpiry < 7) statusColor = "bg-red-50 text-red-600";
                  else if (daysToExpiry <= 15) statusColor = "bg-amber-50 text-amber-600";

                  return (
                    <tr key={p.id}>
                      <td className="flex items-center gap-3">
                        <img src={p.image_url && p.image_url.includes('supabase.co') ? p.image_url : "https://ebhjyczbjldqufvxoeqm.supabase.co/storage/v1/object/public/product-images/products/placeholder-1784974879709.png"} alt={p.name} className="w-11 h-11 rounded-lg object-cover bg-gray-50 border border-gray-100" />
                        <div>
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.category}</p>
                        </div>
                      </td>
                      <td className="text-gray-600">₹{(p.mrp / 100).toFixed(2)}</td>
                      <td>
                        <div className="flex flex-col">
                          <span className="text-gray-600">{new Date(p.expiry_date).toLocaleDateString()}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold w-fit mt-1 ${statusColor}`}>
                            {daysToExpiry > 0 ? `${daysToExpiry} Days Left` : 'Expired'}
                          </span>
                        </div>
                      </td>
                      <td className="font-semibold text-[#0097A7]">{p.discount_percent}% OFF</td>
                      <td className="text-gray-600">
                        <span className={p.stock === 0 ? "text-red-500 font-bold" : ""}>{p.stock}</span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(p)} className="p-2.5 text-gray-400 hover:text-[#0097A7] transition-colors rounded-lg hover:bg-[#E0F7FA]"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{editId ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Product Name</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-premium w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Brand</label>
                    <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="input-premium w-full" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Category</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-premium bg-white w-full">
                      {["Dairy", "Bakery", "Snacks", "Beverages", "Pantry", "Cleaning", "Grocery"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Stock Quantity</label>
                    <input required type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="input-premium w-full" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">MRP (₹)</label>
                    <input required type="number" min="1" step="0.01" value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} className="input-premium w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Expiry Date</label>
                    <input required type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} className="input-premium w-full" />
                    {form.expiry_date && (
                      <p className="text-xs mt-1.5 text-[#0097A7] font-medium">Auto-calculated discount: {previewDiscount}% OFF</p>
                    )}
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Product Image</label>
                    <div className="flex items-center gap-4">
                      {imageFile ? (
                        <p className="text-sm text-green-600 truncate flex-1 font-medium">{imageFile.name}</p>
                      ) : form.image_url ? (
                        <img src={form.image_url} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-gray-100" />
                      ) : null}
                      <label className="flex-1 cursor-pointer bg-gray-50 border border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors">
                        <Upload size={18} className="text-gray-400 mb-1.5" />
                        <span className="text-sm text-gray-500 font-medium">Click to upload image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary py-4 px-8 rounded-xl text-sm">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary py-4 px-8 rounded-xl text-sm">
                    {submitting && <Loader2 size={16} className="animate-spin" />} Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
