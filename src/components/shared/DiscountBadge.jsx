import React from 'react';

export default function DiscountBadge({ discount }) {
  return (
    <div className="bg-[#00BCD4] text-white text-[12px] font-bold px-2.5 py-1 rounded-full shadow-sm">
      {discount}% OFF
    </div>
  );
}
