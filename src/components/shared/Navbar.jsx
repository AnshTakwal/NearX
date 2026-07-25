import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, User, History } from 'lucide-react';
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
    <nav className="bg-primary border-b border-primary-dark sticky top-0 z-50 h-[76px] flex justify-center items-center shadow-md w-full transition-all">
      <div className="container-premium flex items-center justify-between">
        <Link to={profile?.role === 'customer' ? "/products" : "/"} className="text-2xl font-bold text-white tracking-tight">
          NearX
        </Link>
        
        <div className="flex items-center gap-6">
          {!user ? (
            <>
              <Link to="/login" className="text-[14px] font-semibold text-white/80 hover:text-white transition-colors py-3 px-4">
                Login
              </Link>
              <Link to="/register" className="bg-white text-primary hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg text-sm shadow-sm transition-all">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {profile?.role === 'customer' && (
                <>
                  <Link to="/cart" className="relative p-2.5 text-white/90 hover:text-white transition-colors hidden md:block group rounded-lg hover:bg-primary-dark">
                    <ShoppingCart size={22} className="group-hover:scale-105 transition-transform" />
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-primary shadow-sm">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/profile" className="p-2 text-white/90 hover:text-white transition-colors flex items-center gap-2.5 group rounded-lg hover:bg-primary-dark">
                    <div className="w-8 h-8 rounded-full bg-white border border-primary-light flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:ring-2 group-hover:ring-accent shadow-sm">
                      <User size={16} className="text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors hidden lg:inline">
                      {profile.full_name?.split(' ')[0]}
                    </span>
                  </Link>
                </>
              )}
              {profile?.role === 'store_owner' && (
                <div className="flex items-center gap-1 mr-2">
                  <Link to="/store/dashboard" className="text-sm font-semibold text-white/90 hover:text-white transition-colors py-3 px-4 rounded-lg hover:bg-primary-dark">
                    Dashboard
                  </Link>
                  <Link to="/store/products" className="text-sm font-semibold text-white/90 hover:text-white transition-colors py-3 px-4 rounded-lg hover:bg-primary-dark">
                    Inventory
                  </Link>
                  <Link to="/store/orders" className="text-sm font-semibold text-white/90 hover:text-white transition-colors py-3 px-4 rounded-lg hover:bg-primary-dark">
                    Orders
                  </Link>
                </div>
              )}
              {profile?.role === 'delivery_partner' && (
                <div className="flex items-center gap-1 mr-2">
                  <Link to="/delivery/dashboard" className="text-sm font-semibold text-white/90 hover:text-white transition-colors py-3 px-4 rounded-lg hover:bg-primary-dark">
                    Dashboard
                  </Link>
                  <Link to="/delivery/history" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white transition-colors py-3 px-4 rounded-lg hover:bg-primary-dark">
                    <History size={16} />
                    History
                  </Link>
                </div>
              )}


              <button onClick={handleLogout} className="flex items-center gap-2 text-white/80 hover:text-red-200 transition-colors font-semibold text-sm cursor-pointer active:scale-95 ml-1 py-3 px-4 rounded-lg hover:bg-red-500/20">
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
