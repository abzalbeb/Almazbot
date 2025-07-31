
const sessionTimers = {}; // Foydalanuvchi taymerlari ro'yxati

function resetSessionTimer(ctx, timeout = 10 * 60 * 1000) {
  const userId = ctx.from.id;

  // Eski taymerni tozalash
  if (sessionTimers[userId]) {
    clearTimeout(sessionTimers[userId]);
  }

  // Yangi taymer o‘rnatish
  sessionTimers[userId] = setTimeout(async () => {
    console.log(`⏰ Session cleared for user ${userId}`);

    try {
      ctx.session = null;
    } catch (e) {
      console.error(`❌ Session clear error for ${userId}:`, e.message);
    }

    // Foydalanuvchiga sessiya tugaganini aytish (xohlasangiz)
    try {
      await ctx.telegram.sendMessage(
        userId,
        "⏳ Vaqt tugadi. Iltimos, qaytadan boshlang: /start buyrug'ini yuboring."
      );
    } catch (e) {
      console.error(`❌ Can't send timeout message to ${userId}:`, e.message);
    }

    delete sessionTimers[userId]; // Taymerni ro'yxatdan olib tashlash
  }, timeout);
}

module.exports = {
  resetSessionTimer,
};
