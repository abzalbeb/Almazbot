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

  // 💎 Almaz tanlash
  bot.action('menu_diamonds', async (ctx) => {
    ctx.answerCbQuery();

    try {
      if (!diamonds || diamonds.length === 0) {
        return ctx.reply('Hozircha almaz paketlari mavjud emas.');
      }

      const buttons = diamonds.map((item, index) => {
        const formattedPrice = item.price.toLocaleString('uz-UZ');
        return Markup.button.callback(`💎 ${item.amount} ta - ${formattedPrice} so'm`, `order_${index}`);
      });

      const chunked = [];
      for (let i = 0; i < buttons.length; i += 2) {
        chunked.push(buttons.slice(i, i + 2));
      }
      chunked.push([Markup.button.callback('⬅️ Orqaga', 'back_to_menu')]);

      await Promise.all([
        ctx.deleteMessage().catch(() => {}),
        ctx.reply('💎 Quyidagi almaz to‘plamlaridan birini tanlang:', Markup.inlineKeyboard(chunked))
      ]);
    } catch (e) {
      console.error('menu_diamonds xatolik:', e);
      ctx.reply('❌ Xatolik yuz berdi.');
    }
  });

  // 🛠 Texnik yordam
  bot.action('menu_support', async (ctx) => {
    ctx.answerCbQuery();

    try {
      await Promise.all([
        ctx.deleteMessage().catch(() => {}),
        ctx.reply(
          '🛠 Texnik yordam uchun biz bilan bog‘laning:\n\n' +
          '👤 1. Islom - Support \n📩 @MLStoreSupport\n\n',
          Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Orqaga', 'back_to_menu')]
          ])
        )
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

    const pricesText = `
      📋 *Almazlar narxlar ro‘yxati*

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
      `;

    try {
      await Promise.all([
        ctx.deleteMessage().catch(() => {}),
        ctx.replyWithMarkdown(pricesText, Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Orqaga', 'back_to_menu')]
        ]))
      ]);
    } catch (e) {
      console.error('❌ menu_prices xatolik:', e);
    }
  });

  // 📢 Kanal
  bot.action('menu_channel', async (ctx) => {
    ctx.answerCbQuery();

    try {
      await Promise.all([
        ctx.deleteMessage().catch(() => {}),
        ctx.reply(
          '📢 Bizning rasmiy kanalimizga obuna bo‘ling:\n\n👉 [Rasmiy kanal](https://t.me/MLStoreOfficial)',
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('⬅️ Orqaga', 'back_to_menu')]
            ])
          }
        )
      ]);
    } catch (e) {
      console.error('❌ Kanalga havola xatolik:', e);
    }
  });

  
}

module.exports = registerMenuActions;
