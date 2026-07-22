import { Link } from 'react-router-dom';
import { ShoppingCart, Store, Bike, Search } from 'lucide-react';

const roleConfig = {
    customer: { label: 'Customer', icon: ShoppingCart },
    store: { label: 'Store Owner', icon: Store },
    delivery: { label: 'Delivery', icon: Bike },
};

export default function Navbar({ role, cartCount = 0 }) {
    const RoleIcon = roleConfig[role]?.icon;

    return (
        <nav className="bg-primary border-b border-primary-dark sticky top-0 z-50 shadow-md transition-all duration-300">
            <div className="container-premium py-4 flex items-center justify-between">
                {/* Logo */}
                <Link to={role === 'customer' ? "/products" : "/"} className="flex items-center gap-3 no-underline group">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary text-xl font-extrabold shadow-sm group-hover:scale-105 transition-transform duration-300">
                        N
                    </div>
                    <span className="text-2xl font-black tracking-tight text-white group-hover:text-white/90 transition-colors">
                        NearX
                    </span>
                </Link>

                {/* Right side */}
                <div className="flex items-center gap-6">
                    {/* Role indicator */}
                    <div className="hidden sm:flex items-center gap-2 bg-primary-dark/60 text-white px-6 py-2.5 rounded-full text-sm font-bold border border-primary-dark">
                        {RoleIcon && <RoleIcon size={16} strokeWidth={2.5} />}
                        <span>{roleConfig[role]?.label}</span>
                    </div>

                    {/* Cart (customer only) */}
                    {role === 'customer' && (
                        <Link
                            to="/cart"
                            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-primary-dark hover:bg-primary-dark/80 border border-transparent transition-all no-underline group hover:-translate-y-0.5"
                        >
                            <ShoppingCart size={20} className="text-white transition-colors" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-xs font-bold min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full shadow-md border-2 border-primary animate-bounce-short">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
