import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, User } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../hooks/useCart';

export default function Navbar() {
  const { user, profile, logout } = useContext(AuthContext);
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 h-16 flex justify-center items-center shadow-sm w-full">
      <div className="max-w-[1440px] mx-auto w-full px-4 md:px-8 lg:px-10 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7] tracking-tight">
          NearX
        </Link>
        
        <div className="flex items-center gap-5">
          {!user ? (
            <>
              <Link to="/login" className="text-[15px] font-bold text-slate-500 hover:text-[#00BCD4] transition-colors">
                Login
              </Link>
              <Link to="/register" className="bg-[#00BCD4] text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-[#0097A7] transition-all shadow-sm shadow-cyan-150 active:scale-95">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {profile?.role === 'customer' && (
                <>
                  <Link to="/cart" className="relative p-2 text-slate-500 hover:text-[#00BCD4] transition-colors hidden md:block group">
                    <ShoppingCart size={22} className="group-hover:scale-105 transition-transform" />
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-[#EF4444] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black border-2 border-white animate-pulse">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/profile" className="p-2 text-slate-500 hover:text-[#00BCD4] transition-colors flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-[#E0F7FA] border border-[#00BCD4]/25 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:ring-2 group-hover:ring-[#00BCD4]">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={16} className="text-[#00BCD4]" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-600 group-hover:text-[#00BCD4] transition-colors hidden lg:inline">
                      {profile.full_name?.split(' ')[0]}
                    </span>
                  </Link>
                </>
              )}
              {profile?.role === 'store_owner' && (
                <div className="flex items-center gap-4 mr-2">
                  <Link to="/store/dashboard" className="text-sm font-bold text-slate-600 hover:text-[#00BCD4] transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/store/products" className="text-sm font-bold text-slate-600 hover:text-[#00BCD4] transition-colors">
                    Inventory
                  </Link>
                  <Link to="/store/orders" className="text-sm font-bold text-slate-600 hover:text-[#00BCD4] transition-colors">
                    Orders
                  </Link>
                </div>
              )}
              {profile?.role === 'delivery_partner' && (
                <div className="flex items-center gap-4 mr-2">
                  <Link to="/delivery/dashboard" className="text-sm font-bold text-slate-600 hover:text-[#00BCD4] transition-colors">
                    Dashboard
                  </Link>
                </div>
              )}


              <button onClick={handleLogout} className="flex items-center gap-2 text-slate-550 hover:text-[#EF4444] transition-colors font-bold text-sm cursor-pointer active:scale-95 ml-2">
                <LogOut size={18} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
