import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getStoreAnalytics } from '../../api/stores';

export default function RevenueChart({ storeId, initialData }) {
  const [period, setPeriod] = useState(7);
  const [data, setData] = useState(initialData || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (period === 7 && initialData) {
      setData(initialData);
      return;
    }
    
    async function fetchTrend() {
      setLoading(true);
      try {
        const stats = await getStoreAnalytics(storeId, period);
        setData(stats.revenueTrend || []);
      } catch (err) {
        console.error('Failed to fetch trend', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrend();
  }, [period, storeId, initialData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-lg">
          <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
          <p className="text-[#00BCD4] font-bold">
            ₹{(payload[0].value / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
          <p className="text-sm text-gray-500">Sales performance over time</p>
        </div>
        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
          {[7, 30].map(days => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === days 
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-[250px] relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-[#0097A7]" />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(value) => `₹${value / 100}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#00BCD4" 
              strokeWidth={3} 
              dot={{ fill: '#00BCD4', strokeWidth: 2, r: 4, stroke: '#fff' }} 
              activeDot={{ r: 6, fill: '#00BCD4', stroke: '#fff', strokeWidth: 2 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
