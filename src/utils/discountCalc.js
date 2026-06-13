/**
 * Calculate discount percentage and badge info based on days until expiry.
 * Uses the NearX discount tiers:
 * - 30+ days: 10% off (Safe/Green)
 * - 15-30 days: 25% off (Safe/Green)
 * - 7-15 days: 40% off (Buy Soon/Amber)
 * - Under 7 days: 60% off (Last Chance/Red)
 */
export function getDiscountInfo(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      daysLeft: 0,
      discountPercent: 60,
      badge: '🔴 Expired',
      badgeLabel: 'Expired',
      badgeColor: 'bg-danger text-white',
      borderColor: 'border-l-danger',
      bgColor: 'bg-danger-light',
      textColor: 'text-danger',
      dotColor: 'bg-danger',
    };
  }

  if (daysLeft < 7) {
    return {
      daysLeft,
      discountPercent: 60,
      badge: '🔴 Last Chance',
      badgeLabel: 'Last Chance',
      badgeColor: 'bg-danger text-white',
      borderColor: 'border-l-danger',
      bgColor: 'bg-danger-light',
      textColor: 'text-danger',
      dotColor: 'bg-danger',
    };
  }

  if (daysLeft <= 15) {
    return {
      daysLeft,
      discountPercent: 40,
      badge: '⚠️ Buy Soon',
      badgeLabel: 'Buy Soon',
      badgeColor: 'bg-warning text-white',
      borderColor: 'border-l-warning',
      bgColor: 'bg-warning-light',
      textColor: 'text-warning',
      dotColor: 'bg-warning',
    };
  }

  if (daysLeft <= 30) {
    return {
      daysLeft,
      discountPercent: 25,
      badge: '✅ Safe',
      badgeLabel: 'Safe',
      badgeColor: 'bg-success text-white',
      borderColor: 'border-l-success',
      bgColor: 'bg-success-light',
      textColor: 'text-success',
      dotColor: 'bg-success',
    };
  }

  return {
    daysLeft,
    discountPercent: 10,
    badge: '✅ Safe',
    badgeLabel: 'Safe',
    badgeColor: 'bg-success text-white',
    borderColor: 'border-l-success',
    bgColor: 'bg-success-light',
    textColor: 'text-success',
    dotColor: 'bg-success',
  };
}

/**
 * Calculate discounted price
 */
export function getDiscountedPrice(originalPrice, discountPercent) {
  return Math.round(originalPrice * (1 - discountPercent / 100));
}

/**
 * Format currency in Indian style
 */
export function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get category emoji
 */
export function getCategoryEmoji(category) {
  const emojis = {
    'Dairy': '🥛',
    'Bakery': '🍞',
    'Beverages': '🧃',
    'Snacks': '🍿',
    'Frozen': '🧊',
    'Fruits': '🍎',
    'Pantry': '🫙',
    'Breakfast': '🥣',
  };
  return emojis[category] || '📦';
}
