export default function CartItem({ item, onUpdateQuantity, onRemove }) {
    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-blue/20 transition-colors">
            {/* Image placeholder */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue/5 to-blue/10 flex items-center justify-center shrink-0 text-2xl">
                📦
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-800 truncate">{item.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-extrabold text-blue">₹{item.discountedPrice}</span>
                    <span className="text-xs text-gray-400 line-through">₹{item.originalPrice}</span>
                    <span className="text-xs font-semibold text-blue bg-blue/10 px-1.5 py-0.5 rounded-md">
                        -{item.discountPercent}%
                    </span>
                </div>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-1.5 shrink-0">
                <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer border border-gray-200"
                >
                    −
                </button>
                <span className="w-8 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-blue hover:bg-blue-dark text-white font-bold flex items-center justify-center transition-colors cursor-pointer border-none shadow-sm"
                >
                    +
                </button>
            </div>

            {/* Remove */}
            <button
                onClick={() => onRemove(item.id)}
                className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-rose/10 hover:bg-rose/20 text-rose flex items-center justify-center transition-all cursor-pointer border-none shrink-0"
                title="Remove"
            >
                ✕
            </button>
        </div>
    );
}
