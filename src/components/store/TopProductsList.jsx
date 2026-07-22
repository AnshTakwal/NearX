import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TopProductsList({ products }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Top Selling Products</h3>
        <p className="text-sm text-gray-500">By quantity sold</p>
      </div>

      <div className="flex-1 min-h-[250px]">
        {(!products || products.length === 0) ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No sales data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={products} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                width={100}
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" fill="#00BCD4" radius={[0, 4, 4, 0]} barSize={24} name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
