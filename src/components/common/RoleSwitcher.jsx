import { ShoppingCart, Store, Bike } from 'lucide-react';

const roles = [
    { key: 'customer', label: 'Customer', icon: ShoppingCart, desc: 'Browse deals' },
    { key: 'store', label: 'Store Owner', icon: Store, desc: 'Manage products' },
    { key: 'delivery', label: 'Delivery', icon: Bike, desc: 'Deliver orders' },
];

export default function RoleSwitcher({ role, onSwitch }) {
    return (
        <div className="bg-white border-b border-gray-100">
            <div className="max-w-5xl mx-auto px-4 py-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1 shrink-0">
                        View as:
                    </span>
                    {roles.map((r) => (
                        <button
                            key={r.key}
                            onClick={() => onSwitch(r.key)}
                            className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer
                ${role === r.key
                                    ? 'bg-blue text-white shadow-sm shadow-blue/30 border border-blue'
                                    : 'bg-white text-gray-500 hover:text-blue hover:border-blue/40 border border-gray-200'
                                }
              `}
                        >
                            <r.icon size={16} />
                            <span>{r.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
