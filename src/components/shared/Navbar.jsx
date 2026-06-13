import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 px-6 md:px-16 lg:px-24 h-16 flex items-center justify-between shadow-sm">
      <Link to="/" className="text-2xl font-bold text-[#00BCD4] tracking-tight">
        NearX
      </Link>
      
      <div className="flex items-center gap-6">
        {!user ? (
          <>
            <Link to="/login" className="text-[16px] font-medium text-slate-600 hover:text-[#00BCD4] transition-colors">
              Login
            </Link>
            <Link to="/register" className="bg-[#00BCD4] text-white px-5 py-2 rounded-xl font-medium hover:bg-[#0097A7] transition-colors">
              Sign Up
            </Link>
          </>
        ) : (
          <>
            {user.role === 'customer' && (
              <Link to="/cart" className="relative p-2 text-slate-600 hover:text-[#00BCD4] transition-colors hidden md:block">
                <ShoppingCart size={24} />
                <span className="absolute top-0 right-0 bg-[#EF4444] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">2</span>
              </Link>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-600 hover:text-[#EF4444] transition-colors font-medium">
              <LogOut size={20} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
