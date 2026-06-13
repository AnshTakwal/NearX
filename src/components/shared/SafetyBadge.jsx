import React from 'react';
import { ShieldCheck, AlertTriangle, Flame } from 'lucide-react';

export default function SafetyBadge({ days }) {
  let status = "Safe";
  let colorClass = "bg-[#E8F5E9] text-[#22C55E] border-[#bbf7d0]";
  let Icon = ShieldCheck;

  if (days < 7) {
    status = "Last Chance";
    colorClass = "bg-[#FEF2F2] text-[#EF4444] border-[#fecaca]";
    Icon = Flame;
  } else if (days <= 15) {
    status = "Buy Soon";
    colorClass = "bg-[#FFFBEB] text-[#F59E0B] border-[#fde68a]";
    Icon = AlertTriangle;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${colorClass}`}>
      <Icon size={14} />
      <span className="text-[12px] font-medium">Expires in {days} days</span>
    </div>
  );
}
