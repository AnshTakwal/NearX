import { motion } from 'framer-motion';
import { User, MapPin, CreditCard, Bell, LogOut, ShoppingBag, Leaf, Award, ChevronRight, Settings } from 'lucide-react';

export default function CustomerProfilePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-aqua to-aqua-dark rounded-2xl p-6 mb-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border-2 border-white/30">
            👤
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Ansh Tyagi</h1>
            <p className="text-white/70 text-sm">ansh@example.com</p>
            <p className="text-white/60 text-xs mt-1">Member since March 2026</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Orders', value: '4', icon: ShoppingBag },
          { label: 'Total Saved', value: '₹547', icon: Award },
          { label: 'Waste Prevented', value: '12.5 kg', icon: Leaf },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-4 border border-aqua-border/30 shadow-[0_4px_20px_rgba(0,188,212,0.15)] text-center">
            <stat.icon size={20} className="text-aqua mx-auto mb-2" />
            <p className="text-lg font-extrabold text-text-primary">{stat.value}</p>
            <p className="text-[11px] text-text-secondary">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Saved Addresses */}
        <div className="bg-white rounded-2xl border border-aqua-border/30 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-aqua" /> Saved Addresses
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-aqua-light/30 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-text-primary">Home</p>
                <p className="text-xs text-text-secondary">23 Rohini Sector 7, New Delhi 110085</p>
              </div>
              <span className="text-xs text-aqua font-medium bg-aqua-light px-2 py-1 rounded-lg">Default</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-aqua-light/10 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-text-primary">Office</p>
                <p className="text-xs text-text-secondary">Tower B, Cyber City, Gurgaon 122002</p>
              </div>
              <ChevronRight size={16} className="text-text-secondary/30" />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-aqua-border/30 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
            <CreditCard size={16} className="text-aqua" /> Payment Methods
          </h3>
          <div className="flex items-center justify-between p-3 bg-aqua-light/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-aqua-light flex items-center justify-center text-sm">💳</div>
              <div>
                <p className="text-sm font-semibold text-text-primary">•••• •••• •••• 4242</p>
                <p className="text-xs text-text-secondary">Visa • Expires 12/27</p>
              </div>
            </div>
            <span className="text-xs text-aqua font-medium">Primary</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-aqua-border/30 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
            <Bell size={16} className="text-aqua" /> Notification Preferences
          </h3>
          <div className="space-y-3">
            {['Order Updates', 'New Deals Near You', 'Flash Deal Alerts'].map((pref) => (
              <div key={pref} className="flex items-center justify-between">
                <span className="text-sm text-text-primary">{pref}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-aqua-border rounded-full peer peer-checked:bg-aqua peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Settings & Logout */}
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-aqua-border/30 cursor-pointer hover:bg-aqua-light/20 transition-colors">
            <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Settings size={16} className="text-aqua" /> Settings
            </span>
            <ChevronRight size={16} className="text-text-secondary/30" />
          </button>
          <button className="w-full flex items-center gap-2 justify-center p-4 bg-danger-light rounded-2xl text-danger text-sm font-bold cursor-pointer border-none hover:bg-danger/10 transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
