const sessionTimers = {};

function resetSessionTimer(ctx, timeout = 20 * 60 * 1000) {
  const userId = ctx.from.id;

  // Eski taymerni tozalash
  if (sessionTimers[userId]) {
    clearTimeout(sessionTimers[userId]);
  }

  // Yangi taymer
  sessionTimers[userId] = setTimeout(async () => {
    console.log(`⏰ Session cleared for user ${userId}`);

    try {
      // Sessionni xavfsiz tozalash
      if (ctx.session) {
        ctx.session = {}; // <-- xavfsiz yechim
      }
    } catch (e) {
      console.error(`❌ Session clear error for ${userId}:`, e.message);
    }

    try {
      await ctx.telegram.sendMessage(
        userId,
        "⏳ Vaqt tugadi. Iltimos, qaytadan boshlang: /start buyrug'ini yuboring."
      );
    } catch (e) {
      console.error(`❌ Can't send timeout message to ${userId}:`, e.message);
    }

    delete sessionTimers[userId];
  }, timeout);
}

module.exports = {
  resetSessionTimer,
};
