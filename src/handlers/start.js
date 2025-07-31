const { Markup } = require('telegraf');
const { getMainMenu } = require('../utils/keyboard');
const fs = require('fs');
const path = require('path');
const rateLimit = require('../utils/rateLimiter');


module.exports = async function (ctx) {
  const firstName = ctx.from.first_name || 'Foydalanuvchi';
  const userId = ctx.from.id;

    if (!rateLimit(userId, 1500, 1)) { // 1 soniyada 1 ta so‘rov
      return ctx.reply('🚫 Juda tez-tez bosilmoqda. Iltimos, biroz kutib qayta urinib ko‘ring.');
    }

  await ctx.replyWithPhoto(
    { source: fs.createReadStream(path.join(__dirname, '../images/banner.jpg')) },
    {
      caption: `👋🏻 Assalomu alaykum, *${firstName}*!\n\nMobile Legends o'yiniga donat va to'lov qilishda yordam beruvchi botimizga xush kelibsiz!\n\nQuyidagi menyudan kerakli bo‘limni tanlang 👇`,
      parse_mode: 'Markdown',
      reply_markup: getMainMenu().reply_markup,
    }
  );
};
