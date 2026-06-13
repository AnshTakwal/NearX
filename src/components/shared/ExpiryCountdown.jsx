import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ExpiryCountdown({ expiryDate, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(expiryDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(expiryDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiryDate]);

  function getTimeLeft(date) {
    const now = new Date();
    const expiry = new Date(date);
    expiry.setHours(23, 59, 59);
    const diff = expiry - now;

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      expired: false,
    };
  }

  const isUrgent = timeLeft.days < 3;
  const urgentClass = isUrgent ? 'text-danger' : 'text-text-secondary';

  if (compact) {
    return (
      <span className={`text-xs font-medium ${urgentClass}`}>
        {timeLeft.expired
          ? 'Expired'
          : timeLeft.days > 0
            ? `${timeLeft.days}d ${timeLeft.hours}h left`
            : `${timeLeft.hours}h ${timeLeft.minutes}m left`
        }
      </span>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2"
    >
      {timeLeft.expired ? (
        <span className="text-danger font-bold text-sm">⏰ Expired</span>
      ) : (
        <>
          <span className={`text-xs font-medium ${urgentClass}`}>⏰</span>
          <div className="flex gap-1.5">
            {timeLeft.days > 0 && (
              <TimeBlock value={timeLeft.days} label="d" urgent={isUrgent} />
            )}
            <TimeBlock value={timeLeft.hours} label="h" urgent={isUrgent} />
            <TimeBlock value={timeLeft.minutes} label="m" urgent={isUrgent} />
            <TimeBlock value={timeLeft.seconds} label="s" urgent={isUrgent} />
          </div>
        </>
      )}
    </motion.div>
  );
}

function TimeBlock({ value, label, urgent }) {
  return (
    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold ${urgent ? 'bg-danger-light text-danger' : 'bg-aqua-light text-aqua-dark'}`}>
      <span>{String(value).padStart(2, '0')}</span>
      <span className="text-[10px] font-medium opacity-70">{label}</span>
    </div>
  );
}
