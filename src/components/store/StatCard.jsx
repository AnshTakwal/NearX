export default function StatCard({ title, value, subtitle, icon, color = 'blue' }) {
    const colorMap = {
        blue: 'bg-blue/10 text-blue',
        emerald: 'bg-emerald/10 text-emerald',
        amber: 'bg-amber/10 text-amber',
        rose: 'bg-rose/10 text-rose',
        // legacy aliases
        teal: 'bg-blue/10 text-blue',
        navy: 'bg-blue/10 text-blue',
        coral: 'bg-rose/10 text-rose',
    };

    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue/20 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
                <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${colorMap[color] || colorMap.blue}`}
                >
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="text-sm font-semibold text-gray-600 mt-0.5">{title}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
    );
}
