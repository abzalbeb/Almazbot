const { Markup } = require('telegraf');
const { getMainMenu } = require('../utils/keyboard');
const fs = require('fs');
const path = require('path');
const rateLimit = require('../utils/rateLimiter');

const texts = {
  uz: {
    welcome: (name) => `👋🏻 Assalomu alaykum, *${name}*!\n\nMobile Legends o'yiniga donat va to'lov qilishda yordam beruvchi botimizga xush kelibsiz!\n\nQuyidagi menyudan kerakli bo‘limni tanlang 👇`,
  },
  ru: {
    welcome: (name) => `👋🏻 Здравствуйте, *${name}*!\n\nДобро пожаловать в нашего бота, помогающего с донатом и оплатами в игре Mobile Legends!\n\nВыберите нужный раздел ниже 👇`,
  }
};

module.exports = async function (ctx) {
  const firstName = ctx.from.first_name || 'Foydalanuvchi';
  const userId = ctx.from.id;

  if (!rateLimit(userId, 1500, 1)) {
    return ctx.reply('🚫 Juda tez-tez bosilmoqda. Iltimos, biroz kutib qayta urinib ko‘ring.');
  }

  // ❗️YANGI QO‘SHILGAN QISM: session mavjudligini tekshiramiz
  if (!ctx.session) {
    ctx.session = {};
  }

  const lang = ctx.session.language;

  if (!lang || !texts[lang]) {
    return ctx.reply(
      '🗣 Iltimos, tilni tanlang / Пожалуйста, выберите язык:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🇺🇿 O‘zbek tili', callback_data: 'lang_uz' }],
            [{ text: '🇷🇺 Русский язык', callback_data: 'lang_ru' }]
          ]
        }
      }
    );
  }

  const t = texts[lang];

  await ctx.replyWithPhoto(
    { source: fs.createReadStream(path.join(__dirname, '../images/banner.jpg')) },
    {
      caption: t.welcome(firstName),
      parse_mode: 'Markdown',
      reply_markup: getMainMenu(lang).reply_markup,
    }
  );
};