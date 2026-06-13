import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: ShoppingBag, label: 'Products', path: '/products' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: 2 },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.path);
        
        return (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 relative ${isActive ? 'text-[#00BCD4]' : 'text-slate-400 hover:text-slate-600'}`}>
            <div className="relative">
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {item.badge && (
                <span className="absolute -top-1 -right-2 bg-[#EF4444] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[12px] font-medium ${isActive ? 'text-[#00BCD4]' : 'text-slate-500'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
