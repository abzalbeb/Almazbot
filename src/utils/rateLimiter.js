const rateLimitMap = new Map();

function rateLimit(userId, timeout = 3000, limit = 1) {
  const now = Date.now();

  // Agar bu foydalanuvchi hali mapda yo'q bo‘lsa, yangi yozuv qilamiz
  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, [{ time: now }]);
    return true;
  }

  const attempts = rateLimitMap.get(userId);
  const recentAttempts = attempts.filter(entry => now - entry.time < timeout);

  if (recentAttempts.length >= limit) {
    return false; // Limitdan oshib ketgan
  }

  recentAttempts.push({ time: now });
  rateLimitMap.set(userId, recentAttempts);
  return true;
}

module.exports = rateLimit;
