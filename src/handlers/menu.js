const { Markup } = require('telegraf');
const { getMainMenu } = require('../utils/keyboard');
const sendStartMessage = require('../handlers/start');
const diamonds = require('../config/diamonds'); // caching: bitta joyda require qilindi

function registerMenuActions(bot) {
  // 🔙 Asosiy menyu
  bot.action('back_to_menu', async (ctx) => {
    ctx.answerCbQuery(); // callback javobi — delayni kamaytiradi

    try {
      await Promise.all([
        ctx.deleteMessage().catch(() => {}),
        sendStartMessage(ctx)
      ]);
    } catch (e) {
      console.error('❌ back_to_menu xatolik:', e);
    }
  });

  // 💎 Almaz tanlash (boshlanish: server tanlash)
  bot.action('menu_diamonds', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});

      const lang = ctx.session?.language || 'uz';

      // Har bir tilga mos matnlar
      const messages = {
        uz: 'Iltimos, serverni tanlang:',
        ru: 'Пожалуйста, выберите сервер:',
      };

      await ctx.reply(messages[lang], Markup.inlineKeyboard([
        [Markup.button.callback('🇺🇿 UZB Server', 'server_uzb')],
        [Markup.button.callback('🇷🇺 RU Server', 'server_ru')],
        [Markup.button.callback(lang === 'uzb' ? '⬅️ Orqaga' : '⬅️ Назад', 'back_to_menu')],
      ]));
    } catch (e) {
      console.error('menu_diamonds xatolik:', e);
      ctx.reply('❌ Xatolik yuz berdi.');
    }
  });


  bot.action('server_uzb', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});
      ctx.session.server = 'serverUZ';

      const lang = ctx.session?.language || 'uz';
      const uzbDiamonds = diamonds.filter(d => d.amount && (!d.type || d.type === 'uzb'));
      const weeklyPack = diamonds.find(d => d.type === 'weekly_pack');

      if (uzbDiamonds.length === 0) {
        const msg = lang === 'ru' 
          ? 'На данный момент пакеты алмазов недоступны.' 
          : 'Hozircha almaz paketlari mavjud emas.';
        return ctx.reply(msg);
      }

      const diamondButtons = uzbDiamonds.map((item, index) => {
        const formattedPrice = item.price.toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ');
        const label = lang === 'ru'
          ? `💎 ${item.amount} - ${formattedPrice} сум`
          : `💎 ${item.amount} ta - ${formattedPrice} so'm`;
        return Markup.button.callback(label, `order_${index}`);
      });

      const chunked = [];
      for (let i = 0; i < diamondButtons.length; i += 2) {
        chunked.push(diamondButtons.slice(i, i + 2));
      }

      if (weeklyPack) {
        const formattedWeeklyPrice = weeklyPack.price.toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ');
        const title = typeof weeklyPack.title === 'object'
          ? (weeklyPack.title[lang] || weeklyPack.title['uz'])
          : weeklyPack.title; // fallback

        const label = `${title} - ${formattedWeeklyPrice} ${lang === 'ru' ? 'сум' : "so'm"}`;
        chunked.push([Markup.button.callback(label, 'order_weekly_pack')]);
      }

      chunked.push([
        Markup.button.callback(lang === 'ru' ? '⬅️ Назад' : '⬅️ Orqaga', 'menu_diamonds')
      ]);

      const title = lang === 'ru'
        ? '💎 Выберите алмазный пакет:'
        : '💎 Quyidagi almaz to‘plamlaridan birini tanlang:';

      await ctx.reply(title, Markup.inlineKeyboard(chunked));
    } catch (e) {
      console.error('server_uzb xatolik:', e);
      ctx.reply(ctx.session?.language === 'ru'
        ? '❌ Произошла ошибка на сервере UZB.'
        : '❌ UZB serverda xatolik yuz berdi.');
    }
  });



  bot.action('server_ru', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});
      ctx.session.server = 'serverRU';

      const lang = ctx.session?.language || 'uz';
      const ruDiamonds = diamonds.filter(d => d.amount && d.type === 'ru');

      if (ruDiamonds.length === 0) {
        const msg = lang === 'ru'
          ? 'На данный момент алмазы для RU-сервера недоступны.'
          : 'Hozircha RU server uchun almazlar mavjud emas.';
        return ctx.reply(msg);
      }

      const diamondButtons = ruDiamonds.map((item, index) => {
        const formattedPrice = item.price.toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ');
        const label = lang === 'ru'
          ? `💎 ${item.amount} - ${formattedPrice} ₽`
          : `💎 ${item.amount} ta - ${formattedPrice} ₽`;
        return Markup.button.callback(label, `order_ru_${index}`);
      });

      const chunked = [];
      for (let i = 0; i < diamondButtons.length; i += 2) {
        chunked.push(diamondButtons.slice(i, i + 2));
      }

      chunked.push([
        Markup.button.callback(lang === 'ru' ? '⬅️ Назад' : '⬅️ Orqaga', 'menu_diamonds')
      ]);

      const title = lang === 'ru'
        ? '🇷🇺 Алмазные пакеты для RU сервера:'
        : '🇷🇺 RU server uchun almaz to‘plamlari:';

      await ctx.reply(title, Markup.inlineKeyboard(chunked));
    } catch (e) {
      console.error('server_ru xatolik:', e);
      ctx.reply(lang === 'ru'
        ? '❌ Произошла ошибка на сервере RU.'
        : '❌ RU serverda xatolik yuz berdi.');
    }
  });




  // 🛠 Texnik yordam
  bot.action('menu_support', async (ctx) => {
    ctx.answerCbQuery();

    const lang = ctx.session?.language || 'uz'; // Default: uz

    const messages = {
      uz: {
        text:
          '🛠 Texnik yordam uchun biz bilan bog‘laning:\n\n' +
          '👤 1. Islom - Support \n📩 @MLStoreSupport\n\n',
        back: '⬅️ Orqaga'
      },
      ru: {
        text:
          '🛠 Для технической поддержки свяжитесь с нами:\n\n' +
          '👤 1. Ислам - Support \n📩 @MLStoreSupport\n\n',
        back: '⬅️ Назад'
      }
    };

    const msg = messages[lang];

    try {
      await Promise.all([
        ctx.deleteMessage().catch(() => {}),
        ctx.reply(msg.text, {
          ...Markup.inlineKeyboard([
            [Markup.button.callback(msg.back, 'back_to_menu')]
          ])
        })
      ]);
    } catch (e) {
      console.error('❌ Texnik yordam xatolik:', e);
    }
  });


  // ❓ FAQ
  module.exports = function (bot) {
    bot.action('menu_faq', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();

      await ctx.reply('📌 FAQ ishlayapti!'); // test uchun
    });
  };



  // ✍️ Narxlar
    bot.action('menu_prices', async (ctx) => {
      ctx.answerCbQuery();

      const lang = ctx.session.language || 'uz'; // default — uz

      const pricesTextUz = `
    📋 Almazlar narxlari ro‘yxati (UZ server)

    🔸 *O‘rtacha paketlar:*
    • 24 💎 — 6 000 so‘m
    • 44 💎 — 9 000 so‘m
    • 88 💎 — 16 000 so‘m
    • 133 💎 — 25 000 so‘m
    • 177 💎 — 31 000 so‘m
    • 221 💎 — 43 000 so‘m
    • 309 💎 — 58 000 so‘m
    • 354 💎 — 65 000 so‘m
    • 494 💎 — 88 000 so‘m
    • 715 💎 — 120 000 so‘m
    • 1041 💎 — 180 000 so‘m

    🔸 *Katta paketlar:*
    • 1262 💎 — 215 000 so‘m
    • 1535 💎 — 260 000 so‘m
    • 1923 💎 — 325 000 so‘m
    • 2645 💎 — 430 000 so‘m
    • 2778 💎 — 450 000 so‘m
    • 3139 💎 — 510 000 so‘m
    • 3686 💎 — 580 000 so‘m
    • 5290 💎 — 845 000 so‘m
    • 6146 💎 — 980 000 so‘m
    • 6640 💎 — 1 060 000 so‘m
    • 8791 💎 — 1 395 000 so‘m
    • 12292 💎 — 2 050 000 so‘m
    • 🗓 Haftalik Propusk - 20 000 so'm

    


    📋 Almazlar narxlari ro‘yxati (RU server)

    🔸 RU server paketlari:
    • 8 💎 — 20 rubl
    • 35 💎 — 75 rubl
    • 88 💎 — 165 rubl
    • 132 💎 — 271 rubl
    • 264 💎 — 485 rubl
    • 440 💎 — 830 rubl
    • 734 💎 — 1 300.29 rubl
    • 933 💎 — 1 500 rubl
    • 1410 💎 — 2 400 rubl
    • 1880 💎 — 3 200 rubl
    • 2845 💎 — 4 650 rubl
    • 6163 💎 — 10 150 rubl
    `;

      const pricesTextRu = `
    📋 *Список цен на алмазы (UZ сервер)*

    🔸 *Средние пакеты:*
    • 24 💎 — 6 000 сум
    • 44 💎 — 9 000 сум
    • 88 💎 — 16 000 сум
    • 133 💎 — 25 000 сум
    • 177 💎 — 31 000 сум
    • 221 💎 — 43 000 сум
    • 309 💎 — 58 000 сум
    • 354 💎 — 65 000 сум
    • 494 💎 — 88 000 сум
    • 715 💎 — 120 000 сум
    • 1041 💎 — 180 000 сум

    🔸 *Крупные пакеты:*
    • 1262 💎 — 215 000 сум
    • 1535 💎 — 260 000 сум
    • 1923 💎 — 325 000 сум
    • 2645 💎 — 430 000 сум
    • 2778 💎 — 450 000 сум
    • 3139 💎 — 510 000 сум
    • 3686 💎 — 580 000 сум
    • 5290 💎 — 845 000 сум
    • 6146 💎 — 980 000 сум
    • 6640 💎 — 1 060 000 сум
    • 8791 💎 — 1 395 000 сум
    • 12292 💎 — 2 050 000 сум
    • 🗓 Еженедельный пропуск - 20 000 сум
   
   
    📋 *Список цен на алмазы (RU сервер)*

    🔸 *Пакеты RU сервера:*
    • 8 💎 — 20 руб
    • 35 💎 — 75 руб
    • 88 💎 — 165 руб
    • 132 💎 — 271 руб
    • 264 💎 — 485 руб
    • 440 💎 — 830 руб
    • 734 💎 — 1 300.29 руб
    • 933 💎 — 1 500 руб
    • 1410 💎 — 2 400 руб
    • 1880 💎 — 3 200 руб
    • 2845 💎 — 4 650 руб
    • 6163 💎 — 10 150 руб
   
    `;

      const backText = lang === 'ru' ? '⬅️ Назад' : '⬅️ Orqaga';
      const pricesText = lang === 'ru' ? pricesTextRu : pricesTextUz;

      try {
        await Promise.all([
          ctx.deleteMessage().catch(() => {}),
          ctx.replyWithMarkdown(pricesText, Markup.inlineKeyboard([
            [Markup.button.callback(backText, 'back_to_menu')]
          ]))
        ]);
      } catch (e) {
        console.error('❌ menu_prices xatolik:', e);
      }
    });


    // 📢 Kanal
    bot.action('menu_channel', async (ctx) => {
      ctx.answerCbQuery();

      const lang = ctx.session?.language || 'uz'; // Default UZ

      const messages = {
        uz: {
          text: '📢 Bizning rasmiy kanalimizga obuna bo‘ling:\n\n👉 [Rasmiy kanal](https://t.me/MLStoreOfficial)',
          back: '⬅️ Orqaga'
        },
        ru: {
          text: '📢 Подпишитесь на наш официальный канал:\n\n👉 [Официальный канал](https://t.me/MLStoreOfficial)',
          back: '⬅️ Назад'
        }
      };

      const msg = messages[lang];

      try {
        await Promise.all([
          ctx.deleteMessage().catch(() => {}),
          ctx.reply(msg.text, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback(msg.back, 'back_to_menu')]
            ])
          })
        ]);
      } catch (e) {
        console.error('❌ Kanalga havola xatolik:', e);
      }
    });



  bot.action('change_language', async (ctx) => {
    try {
      await ctx.answerCbQuery();

      if (!ctx.session) ctx.session = {};

      // Tilni almashtirish
      ctx.session.language = ctx.session.language === 'uz' ? 'ru' : 'uz';

      // Eski xabarni o‘chirish
      await ctx.deleteMessage().catch(() => {});

      // Asosiy menyuni yuborish
      await sendStartMessage(ctx);

    } catch (error) {
      console.error('❌ change_language action xatolik:', error);
    }
  });



}

module.exports = registerMenuActions;
