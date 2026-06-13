const steps = [
    { key: 'placed', label: 'Placed', icon: '📋' },
    { key: 'accepted', label: 'Accepted', icon: '✅' },
    { key: 'picked_up', label: 'Picked Up', icon: '🚴' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' },
];

function getStepIndex(status) {
    return steps.findIndex((s) => s.key === status);
}

export default function OrderStatusStepper({ status }) {
    const currentIndex = getStepIndex(status);

    return (
        <div className="w-full py-4">
            <div className="flex items-center justify-between relative">
                {/* Progress line track */}
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 rounded-full mx-8" />
                {/* Progress fill */}
                <div
                    className="absolute top-5 left-0 h-1 bg-blue rounded-full mx-8 transition-all duration-500"
                    style={{
                        width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 4rem)`,
                    }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                        <div key={step.key} className="flex flex-col items-center z-10 relative">
                            <div
                                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-lg
                  transition-all duration-300
                  ${isCompleted
                                        ? 'bg-blue text-white shadow-md shadow-blue/30'
                                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                                    }
                  ${isCurrent ? 'ring-4 ring-blue/20 scale-110' : ''}
                `}
                            >
                                {step.icon}
                            </div>
                            <span
                                className={`
                  mt-2 text-xs font-semibold whitespace-nowrap
                  ${isCompleted ? 'text-blue' : 'text-gray-400'}
                `}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
