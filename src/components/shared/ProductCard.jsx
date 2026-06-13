import React from 'react';
import { Link } from 'react-router-dom';
import SafetyBadge from './SafetyBadge';
import DiscountBadge from './DiscountBadge';

export default function ProductCard({ product }) {
  const { id, name, brand, mrp, daysToExpiry, image } = product;

  // Calculate discount logic
  let discount = 10;
  if (daysToExpiry < 7) discount = 60;
  else if (daysToExpiry <= 15) discount = 40;
  else if (daysToExpiry <= 30) discount = 25;

  const salePrice = Math.round(mrp - (mrp * discount) / 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow group flex flex-col relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <DiscountBadge discount={discount} />
      </div>
      
      <div className="w-full h-48 bg-slate-50 rounded-xl mb-4 overflow-hidden relative">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { 
            e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop" 
          }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <div>
            <p className="text-[14px] text-slate-500 font-medium">{brand}</p>
            <h3 className="text-[16px] font-semibold text-[#1A1A2E] leading-tight line-clamp-2">{name}</h3>
          </div>
        </div>

        <div className="mt-3 mb-4">
          <SafetyBadge days={daysToExpiry} />
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-[14px] text-slate-400 line-through">₹{mrp}</p>
            <p className="text-[20px] font-bold text-[#00BCD4]">₹{salePrice}</p>
          </div>
          <button className="bg-[#E0F7FA] text-[#0097A7] hover:bg-[#00BCD4] hover:text-white px-4 py-2 rounded-xl font-medium transition-colors">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
