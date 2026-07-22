import React from 'react';
import { ShieldCheck, AlertTriangle, Flame } from 'lucide-react';

export default function SafetyBadge({ days }) {
  let status = "Safe";
  let colorClass = "bg-green-50 text-green-600 border-green-200";
  let Icon = ShieldCheck;

  if (days < 7) {
    status = "Last Chance";
    colorClass = "bg-red-50 text-red-600 border-red-200";
    Icon = Flame;
  } else if (days <= 15) {
    status = "Buy Soon";
    colorClass = "bg-amber-50 text-amber-600 border-amber-200";
    Icon = AlertTriangle;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border ${colorClass}`}>
      <Icon size={13} />
      <span className="text-[12px] font-medium">{days === 0 ? 'Expired' : `Expires in ${days} days`}</span>
    </div>
  );
}
