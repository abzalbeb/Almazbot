const { Telegraf, session } = require('telegraf');
const { BOT_TOKEN } = require('./config/env');

const startHandler = require('./handlers/start');
const registerMenuActions = require('./handlers/menu');
const orderHandler = require('./handlers/order');
const faqHandler = require('./handlers/faq');
const { resetSessionTimer } = require('./utils/sessionCleaner');

const bot = new Telegraf(BOT_TOKEN);

// ✅ Session middleware NI ULASH
bot.use(session());


bot.telegram.setMyCommands([
  { command: 'start', description: 'Asosiy menyu' },
]);

bot.command('menu', (ctx) => {
  ctx.reply('Asosiy menyu');
})

// ✅ Til tanlash action-lari
bot.action('lang_uz', async (ctx) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.language = 'uz';
  await ctx.answerCbQuery();

  // ❌ Til tanlash xabarini o‘chirish
  try {
    await ctx.deleteMessage();
  } catch (err) {
    console.error('Xabarni o‘chirishda xatolik:', err);
  }

  // await ctx.reply('✅ Til tanlandi: O‘zbek tili');
  startHandler(ctx);
});

bot.action('lang_ru', async (ctx) => {
  if (!ctx.session) ctx.session = {};
  ctx.session.language = 'ru';
  await ctx.answerCbQuery();

  // ❌ Til tanlash xabarini o‘chirish
  try {
    await ctx.deleteMessage();
  } catch (err) {
    console.error('Xabarni o‘chirishda xatolik:', err);
  }

  // await ctx.reply('✅ Язык выбран: Русский язык');
  startHandler(ctx);
});

  // Har bir foydalanuvchi interactionida taymerni reset qilish
  bot.use((ctx, next) => {
    if (ctx.from && ctx.session) {
      console.log('Session:', ctx.session);
      resetSessionTimer(ctx);
    }
    return next();
  });


// Start buyrug'i
bot.start((ctx) => startHandler(ctx));




// MENU CALLBACK ACTION-larni ro‘yxatdan o‘tkazamiz
registerMenuActions(bot);

// BUYURTMA (almaz tanlangandan keyin ishlaydi)
orderHandler(bot);

// Savollarga javob
faqHandler(bot);

// Screenshot yuborilganda (buyurtma jarayoni)
bot.on('photo', (ctx) => orderHandler.handlePhoto(ctx));

// Xatoliklar uchun
bot.catch((err, ctx) => {
  console.error('Bot xatolikka uchradi:', err);
  ctx.reply('❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.');
});

// Botni ishga tushirish
bot.launch().then(() => {
  console.log('🚀 Bot ishga tushdi');
});

