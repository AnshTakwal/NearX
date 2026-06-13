import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Leaf, ShoppingBag } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { storeAnalytics } from '../../data/mockData';

export default function StoreAnalyticsPage() {
  const [period, setPeriod] = useState('7days');
  const { revenueData, categoryBreakdown, topProducts, metrics } = storeAnalytics;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">Store Analytics</h1>
          <p className="text-sm text-text-secondary">Track your store's performance</p>
        </div>
        <div className="flex bg-aqua-light/50 rounded-xl p-1">
          {['7days', '30days'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer border-none transition-all ${
                period === p ? 'bg-aqua text-white shadow-md shadow-aqua/30' : 'bg-transparent text-text-secondary'
              }`}>
              {p === '7days' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: `₹${metrics.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'aqua' },
          { label: 'Total Orders', value: metrics.totalOrders, icon: ShoppingBag, color: 'success' },
          { label: 'Waste Prevented', value: `${metrics.foodWastePrevented} kg`, icon: Leaf, color: 'warning' },
          { label: 'Repeat Customers', value: `${metrics.repeatCustomerRate}%`, icon: Users, color: 'aqua' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-aqua-border/30 shadow-[0_4px_20px_rgba(0,188,212,0.15)]">
            <stat.icon size={20} className="text-aqua mb-2" />
            <p className="text-2xl font-extrabold text-text-primary mb-1">{stat.value}</p>
            <p className="text-xs text-text-secondary">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-aqua-border/30 p-5 shadow-[0_4px_20px_rgba(0,188,212,0.15)]">
          <h3 className="text-sm font-bold text-text-primary mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0F7FA" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#546E7A' }} />
              <YAxis tick={{ fontSize: 12, fill: '#546E7A' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #B2EBF2', boxShadow: '0 4px 20px rgba(0,188,212,0.15)' }} />
              <Line type="monotone" dataKey="revenue" stroke="#00BCD4" strokeWidth={3} dot={{ fill: '#00BCD4', r: 5 }} activeDot={{ r: 8, fill: '#00E5FF' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Products */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-aqua-border/30 p-5 shadow-[0_4px_20px_rgba(0,188,212,0.15)]">
          <h3 className="text-sm font-bold text-text-primary mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E0F7FA" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#546E7A' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#546E7A' }} width={120} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #B2EBF2' }} />
              <Bar dataKey="sold" fill="#00BCD4" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-aqua-border/30 p-5 shadow-[0_4px_20px_rgba(0,188,212,0.15)]">
          <h3 className="text-sm font-bold text-text-primary mb-4">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {categoryBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #B2EBF2' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Food Waste Counter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-aqua to-aqua-dark rounded-2xl p-8 text-white relative overflow-hidden flex flex-col items-center justify-center text-center shadow-lg">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <Leaf size={40} className="mx-auto mb-4 text-aqua-accent" />
            <p className="text-5xl font-extrabold mb-2">{metrics.foodWastePrevented}</p>
            <p className="text-lg font-semibold text-white/90 mb-1">Kg Food Waste Prevented</p>
            <p className="text-sm text-white/60">Your contribution to a sustainable future 🌍</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
