import React from 'react';
import { AlertTriangle, Plus, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LowStockAlert({ products }) {
  const LOW_STOCK_THRESHOLD = 5;
  const lowStockProducts = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 flex flex-col h-full relative overflow-hidden">
      {lowStockProducts.length > 0 && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
      )}
      
      <div className="mb-4 relative z-10 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Low Stock Alerts
            {lowStockProducts.length > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {lowStockProducts.length}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500">Items running out soon</p>
        </div>
        <AlertTriangle size={20} className={lowStockProducts.length > 0 ? "text-red-500" : "text-gray-300"} />
      </div>

      <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[250px] pr-2 relative z-10 custom-scrollbar">
        {lowStockProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
            <CheckCircle size={32} className="text-green-400 mb-3" />
            <p>Inventory looks good!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0">
                    <img src={product.image_url && product.image_url.includes('supabase.co') ? product.image_url : "https://ebhjyczbjldqufvxoeqm.supabase.co/storage/v1/object/public/product-images/products/placeholder-1784974879709.png"} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</p>
                    <p className={`text-xs font-semibold ${product.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                      {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                    </p>
                  </div>
                </div>
                <Link to="/store/products" className="p-2 text-[#0097A7] bg-[#E0F7FA] rounded-lg hover:bg-[#B2EBF2] transition-colors">
                  <Plus size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
