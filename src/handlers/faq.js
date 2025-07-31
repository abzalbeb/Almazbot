// src/handlers/faq.js
const sendStartMessage = require('./start');

function registerFaq(bot) {
  const faqAnswers = {
  faq_how: {
      text:
        '1. Almaz paketini tanlaysiz\n' +
        '2. Game ID va Zone ID ni kiritasiz\n' +
        '3. To‘lovni amalga oshirasiz (Click/Payme/Uzum/UzCard)\n' +
        '4. To‘lov kvitansiyasining screenshot (rasmi) ni botga yuborasiz\n' +
        '5. Adminlar to‘lovni tekshiradi\n' +
        '6. Almaz 1–10 daqiqa ichida hisobingizga tushiriladi'
    },

    faq_what: {
        text:
          '🎮 Game ID — o‘yin ichidagi yagona identifikatsiya raqamingiz.\n' +
          '🧩 Zone ID — zona raqami (odatda 4 raqamdan iborat).\n\n' +
          'Masalan: 123456789 (1234)'
      }
      ,
    faq_where: {
      text:
        '1. Mobile Legends ilovasini oching\n' +
        '2. Profilingizga kiring (chap yuqorida)\n' +
        '3. “ID: 123456789 (1234)” ko‘rinishida yozilgan bo‘ladi\n\n' +
        '123456789 — bu Game ID\n1234 — bu Zone ID'
    },
    faq_time: {
      text:
        '⏱ Odatda 1–10 daqiqa ichida almaz yetkaziladi.\n' +
        'Ba’zida yuklama sababli 20 daqiqagacha cho‘zilishi mumkin.'
    },
    faq_paid: {
      text:
        '1. Qayta to‘lov qilmasdan oldin kuting.\n' +
        '2. Admin bilan bog‘laning va kvitansiya rasmini yuboring.\n' +
        '3. To‘lovingiz tekshiriladi va almaz yuboriladi.'
    },
    faq_method: {
      text:
        'Biz quyidagi to‘lov tizimlarini qabul qilamiz:\n' +
        '- Click\n- Payme\n- Uzum\n- Uzcard\n\n' +
        'To‘lovdan so‘ng kvitansiyani yuborish kerak.'
    },
    faq_block: {
      text:
        'Yo‘q, biz rasmiy donat kanalidan foydalanamiz.\n' +
        'Sizning hisobingiz hech qanday xavf ostida emas.'
    }
  };

  // Faq menyusi
  bot.action('menu_faq', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      await ctx.deleteMessage();
    } catch (e) {
      console.error('❌ Xabarni o‘chirishda xatolik:', e);
    }

    await ctx.telegram.sendMessage(ctx.chat.id, 'Quyidagi savollardan birini tanlang:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎 Qanday ishlaydi?', callback_data: 'faq_how' }],
          [{ text: '🎮 Game ID va Zone ID nima?', callback_data: 'faq_what' }],
          [{ text: '📍 ID qayerdan olinadi?', callback_data: 'faq_where' }],
          [{ text: '⏱ Yetkazilish vaqti qancha?', callback_data: 'faq_time' }],
          [{ text: '❗️ Pul to‘ladim, ammo almaz kelmadi', callback_data: 'faq_paid' }],
          [{ text: '💰 Qanday to‘lov turlari bor?', callback_data: 'faq_method' }],
          [{ text: '🚫 Hisob bloklanmaydimi?', callback_data: 'faq_block' }],
          [{ text: '⬅️ Orqaga', callback_data: 'back_to_menu' }]
        ]
      }
    });
  });

  // Har bir savolga mos javobni ko‘rsatish
  Object.keys(faqAnswers).forEach((faqKey) => {
    bot.action(faqKey, async (ctx) => {
      await ctx.answerCbQuery();
      try {
        await ctx.deleteMessage();
      } catch (e) {
        console.error('❌ Xabarni o‘chirishda xatolik:', e);
      }

      await ctx.telegram.sendMessage(ctx.chat.id, faqAnswers[faqKey].text, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Orqaga', callback_data: 'menu_faq' }]
          ]
        }
      });
    });
  });

  // Orqaga qaytish — bosh menyuga
  bot.action('back_to_menu', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      await ctx.deleteMessage();
    } catch (e) {
      console.error('❌ Xabarni o‘chirishda xatolik:', e);
    }
    await sendStartMessage(ctx);
  });
}

module.exports = registerFaq;
