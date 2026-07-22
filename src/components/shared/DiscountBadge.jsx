import React from 'react';

export default function DiscountBadge({ discount }) {
  return (
    <div className="bg-accent text-white text-[11px] font-bold px-5 py-1.5 rounded-full shadow-sm tracking-wide">
      {discount}% OFF
    </div>
  );
}
