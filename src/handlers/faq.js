const { Markup } = require('telegraf');
const sendStartMessage = require('./start'); // kerakli joyda import

function registerFaq(bot) {
  const faqAnswers = {
    uz: {
      faq_how: '1. Almaz paketini tanlaysiz\n2. Game ID va Zone ID ni kiritasiz\n3. To‘lovni amalga oshirasiz (Click/Payme/Uzum/UzCard)\n4. To‘lov kvitansiyasining screenshot (rasmi) ni botga yuborasiz\n5. Adminlar to‘lovni tekshiradi\n6. Almaz 1–10 daqiqa ichida hisobingizga tushiriladi',
      faq_what: '🎮 Game ID — o‘yin ichidagi yagona identifikatsiya raqamingiz.\n🧩 Zone ID — zona raqami (odatda 4 raqamdan iborat).\n\nMasalan: 123456789 (1234)',
      faq_where: '1. Mobile Legends ilovasini oching\n2. Profilingizga kiring (chap yuqorida)\n3. “ID: 123456789 (1234)” ko‘rinishida yozilgan bo‘ladi\n\n123456789 — bu Game ID\n1234 — bu Zone ID',
      faq_time: '⏱ Odatda 1–15 daqiqa ichida almaz yetkaziladi.\nBa’zida yuklama sababli 20 daqiqagacha cho‘zilishi mumkin.',
      faq_paid: '1. Qayta to‘lov qilmasdan oldin kuting.\n2. Admin bilan bog‘laning va kvitansiya rasmini yuboring.\n3. To‘lovingiz tekshiriladi va almaz yuboriladi.',
      faq_method: 'Biz quyidagi to‘lov tizimlarini qabul qilamiz:\n- Click\n- Payme\n- Uzum\n- Uzcard\n\nTo‘lovdan so‘ng kvitansiyani yuborish kerak.',
      faq_block: 'Yo‘q, biz rasmiy donat kanalidan foydalanamiz.\nSizning hisobingiz hech qanday xavf ostida emas.'
    },
    ru: {
      faq_how: '1. Вы выбираете пакет алмазов\n2. Вводите Game ID и Zone ID\n3. Оплачиваете (Click/Payme/Uzum/UzCard)\n4. Отправляете скриншот квитанции\n5. Админы проверяют платёж\n6. Алмазы поступают в течение 1–10 минут',
      faq_what: '🎮 Game ID — уникальный идентификатор в игре.\n🧩 Zone ID — код зоны (обычно 4 цифры).\n\nПример: 123456789 (1234)',
      faq_where: '1. Откройте Mobile Legends\n2. Перейдите в свой профиль (вверху слева)\n3. Там будет написано “ID: 123456789 (1234)”\n\n123456789 — это Game ID\n1234 — это Zone ID',
      faq_time: '⏱ Обычно доставка занимает 1–15 минут.\nИногда может занять до 20 минут из-за загрузки.',
      faq_paid: '1. Не оплачивайте повторно — подождите.\n2. Свяжитесь с админом и отправьте скриншот.\n3. Платёж будет проверен и алмазы отправлены.',
      faq_method: 'Мы принимаем следующие способы оплаты:\n- Click\n- Payme\n- Uzum\n- Uzcard\n\nПосле оплаты обязательно отправьте квитанцию.',
      faq_block: 'Нет, мы используем официальный донат-канал.\nВаш аккаунт в безопасности.'
    }
  };

  // FAQ menyusi
  bot.action('menu_faq', async (ctx) => {
    const lang = ctx.session?.language || 'uz';
    await ctx.answerCbQuery();
    try {
      await ctx.deleteMessage();
    } catch (e) {
      console.error('❌ FAQ menyuda xatolik:', e);
    }

    const title = lang === 'ru' ? 'Выберите один из вопросов ниже:' : 'Quyidagi savollardan birini tanlang:';
    const backText = lang === 'ru' ? '⬅️ Назад' : '⬅️ Orqaga';

    await ctx.telegram.sendMessage(ctx.chat.id, title, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎 ' + (lang === 'ru' ? 'Как это работает?' : 'Qanday ishlaydi?'), callback_data: 'faq_how' }],
          [{ text: '🎮 ' + (lang === 'ru' ? 'Что такое Game ID и Zone ID?' : 'Game ID va Zone ID nima?'), callback_data: 'faq_what' }],
          [{ text: '📍 ' + (lang === 'ru' ? 'Где найти ID?' : 'ID qayerdan olinadi?'), callback_data: 'faq_where' }],
          [{ text: '⏱ ' + (lang === 'ru' ? 'Сколько ждать?' : 'Yetkazilish vaqti qancha?'), callback_data: 'faq_time' }],
          [{ text: '❗️ ' + (lang === 'ru' ? 'Оплатил, но алмазы не пришли' : 'Pul to‘ladim, ammo almaz kelmadi'), callback_data: 'faq_paid' }],
          [{ text: '💰 ' + (lang === 'ru' ? 'Какие способы оплаты?' : 'Qanday to‘lov turlari bor?'), callback_data: 'faq_method' }],
          [{ text: '🚫 ' + (lang === 'ru' ? 'Аккаунт не заблокируют?' : 'Hisob bloklanmaydimi?'), callback_data: 'faq_block' }],
          [{ text: backText, callback_data: 'back_to_menu' }]
        ]
      }
    });
  });

  // Savollarga javob
  Object.keys(faqAnswers.uz).forEach((faqKey) => {
    bot.action(faqKey, async (ctx) => {
      const lang = ctx.session?.language || 'uz';
      await ctx.answerCbQuery();

      try {
        await ctx.deleteMessage();
      } catch (e) {
        console.error(`❌ ${faqKey} javobida xatolik:`, e);
      }

      await ctx.telegram.sendMessage(ctx.chat.id, faqAnswers[lang][faqKey], {
        reply_markup: {
          inline_keyboard: [
            [{ text: lang === 'ru' ? '⬅️ Назад' : '⬅️ Orqaga', callback_data: 'menu_faq' }]
          ]
        }
      });
    });
  });

  // Orqaga - Bosh menyuga
  bot.action('back_to_menu', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      await ctx.deleteMessage();
    } catch (e) {
      console.error('❌ Orqaga qaytishda xatolik:', e);
    }
    await sendStartMessage(ctx); // bosh menyuga qaytish
  });
}

module.exports = registerFaq;
