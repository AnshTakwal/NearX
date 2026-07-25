import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User, Package } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

export default function BottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  const navItems = [
    { icon: Home, label: 'Home', path: '/products' },
    { icon: ShoppingBag, label: 'Products', path: '/products' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: itemCount },
    { icon: Package, label: 'Orders', path: '/orders' },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3.5 flex justify-around items-center z-50 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]" style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))' }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.path);
        
        return (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 relative py-1 px-3 rounded-xl transition-colors ${isActive ? 'text-[#0097A7]' : 'text-gray-400 hover:text-gray-600'}`}>
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#DC2626] text-white text-[10px] w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[11px] font-medium ${isActive ? 'text-[#0097A7]' : 'text-gray-500'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
