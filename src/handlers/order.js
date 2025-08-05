const { Markup } = require('telegraf');
const diamonds = require('../config/diamonds');
const axios = require('axios');

module.exports = function registerOrderActions(bot) {
  const ADMIN_CHANNEL_ID = parseInt(process.env.ADMIN_CHANNEL_ID, 10);

  // 1. Almaz tanlash va Game ID + Zone ID so‘rash
  bot.action(/order(_ru)?_(\d+)/, async (ctx) => {
    try {
      await ctx.answerCbQuery();

      const lang = ctx.session?.language || 'uz';
      const isRuLang = lang === 'ru';
      const server = ctx.session?.server || 'serverUZ'; // Default UZB
      const index = Number(ctx.match[2]);

      let filteredDiamonds;

      if (server === 'serverRU') {
        filteredDiamonds = diamonds.filter(d => d.amount && d.type === 'ru');
      } else {
        // serverUZ yoki default
        filteredDiamonds = diamonds.filter(d => d.amount && (!d.type || d.type === 'uzb'));
      }

      const selected = filteredDiamonds[index];

      if (!selected) {
        return ctx.reply(isRuLang ? '❌ Неверный выбор.' : '❌ Noto‘g‘ri tanlov.');
      }

      ctx.session = ctx.session || {};
      ctx.session.tempOrder = { ...selected };
      ctx.session.step = 'awaiting_full_id';

      const message = isRuLang
        ? `Пожалуйста, введите *Game ID* и *Zone ID* в следующем формате:\n\n📌 \`123456789 (1234)\`\n\n⚠️ *Не забудьте указать Server ID!*`
        : `Iltimos, *Game ID* va *Zone ID* ni quyidagi formatda kiriting:\n\n📌 \`123456789 (1234)\`\n\n⚠️ *Server ID’sini unutmang!*`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('❌ order_x actionda xatolik:', err);
      const lang = ctx.session?.language || 'uz';
      const errorMessage = lang === 'ru'
        ? '❌ Произошла ошибка при оформлении заказа.'
        : '❌ Buyurtma bosqichida xatolik yuz berdi.';
      ctx.reply(errorMessage);
    }
  });



  

  bot.action('order_weekly_pack', async (ctx) => {
    try {
      await ctx.answerCbQuery();

      const weeklyPack = diamonds.find(d => d.type === 'weekly_pack');

      if (!weeklyPack) {
        const msg = ctx.session?.language === 'ru'
          ? '❌ Еженедельный пропуск пока недоступен.'
          : '❌ Haftalik propusk hozircha mavjud emas.';
        return ctx.reply(msg);
      }

      ctx.session = ctx.session || {};
      ctx.session.tempOrder = { ...weeklyPack };
      ctx.session.step = 'awaiting_full_id';

      const lang = ctx.session.language || 'uz';

      const messages = {
        uz: `Iltimos, *Game ID* va *Zone ID* ni quyidagi formatda kiriting:\n\n📌 \`123456789 (1234)\`\n\n⚠️ *Server ID’sini unutmang!*`,
        ru: `Пожалуйста, введите *Game ID* и *Zone ID* в следующем формате:\n\n📌 \`123456789 (1234)\`\n\n⚠️ *Не забудьте указать Server ID!*`
      };

      await ctx.reply(messages[lang], { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('❌ order_weekly_pack actionda xatolik:', err);
      const msg = ctx.session?.language === 'ru'
        ? '❌ Произошла ошибка на этапе заказа.'
        : '❌ Buyurtma bosqichida xatolik yuz berdi.';
      ctx.reply(msg);
    }
  });



  // 2. Game ID + Zone ID kiritish va Codashop orqali nickname olish
  bot.on('text', async (ctx) => {
    ctx.session = ctx.session || {};
    const lang = ctx.session?.language || 'uz';
    const input = ctx.message.text.trim();

    // Xabarlar
    const messages = {
      invalidFormat: {
        uz: '❌ Format noto‘g‘ri. Iltimos, *Game ID* va *Zone ID* ni quyidagi formatda yuboring:\n\n📌 `476595202 (2451)`',
        ru: '❌ Неверный формат. Пожалуйста, отправьте *Game ID* и *Zone ID* в следующем формате:\n\n📌 `476595202 (2451)`',
      },
      playerNotFound: {
        uz: '❌ O‘yinchi topilmadi. Iltimos, Game ID va Zone ID ni tekshirib, qayta yuboring.',
        ru: '❌ Игрок не найден. Пожалуйста, проверьте Game ID и Zone ID и отправьте снова.',
      },
      serverError: {
        uz: '❌ Server bilan bog‘lanishda xatolik yuz berdi. Keyinroq urinib ko‘ring.',
        ru: '❌ Произошла ошибка при подключении к серверу. Пожалуйста, попробуйте позже.',
      },
      isThisYou: {
        uz: '🔍 Topilgan nickname: *{encodedNickname}*\n\nBu sizmisiz?\n\n📦 *Buyurtma tafsilotlari:*',
        ru: '🔍 Найденный никнейм: *{encodedNickname}*\n\nЭто вы?\n\n📦 *Детали заказа:*',
      },
      weeklyPack: {
        uz: '- 🗓 Paket: Haftalik propusk\n',
        ru: '- 🗓 Пакет: Еженедельный пропуск\n',
      },
      diamondAmount: {
        uz: '- 💎 Almaz: {amount} ta\n',
        ru: '- 💎 Алмазы: {amount} шт.\n',
      },
      gameId: {
        uz: '- 🎮 Game ID: `{gameId}`\n- 🌐 Zone ID: `{zoneId}`',
        ru: '- 🎮 Game ID: `{gameId}`\n- 🌐 Zone ID: `{zoneId}`',
      },
      awaitingReceiptNote: {
        uz: '🧾 Chek kutilyapti – bu bosqich uchun boshqa handler ishlaydi.',
        ru: '🧾 Ожидается чек – для этого шага используется другой обработчик.',
      },
    };

    if (ctx.session.step === 'awaiting_full_id') {
      const match = input.match(/^(\d{5,15})\s*\((\d{2,6})\)$/);

      if (!match) {
        console.log('❗️Format xato:', input);
        return ctx.reply(messages.invalidFormat[lang], { parse_mode: 'Markdown' });
      }

      const gameId = match[1];
      const zoneId = match[2];

      const payload = {
        country: 'sg',
        voucherTypeName: 'MOBILE_LEGENDS',
        whiteLabelId: '',
        userId: gameId,
        zoneId: zoneId,
        deviceId: '8afcdd63-fee2-4c6b-8a07-4c0efdfd5efa',
      };

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N)',
        'Origin': 'https://www.codashop.com',
        'Referer': 'https://www.codashop.com/id-id/mobile-legends',
      };

      try {
        const response = await axios.post(
          'https://order-sg.codashop.com/validate/',
          payload,
          { headers }
        );

        const encodedNickname = response.data?.result?.username;

        if (!encodedNickname) {
          console.log('❌ Nickname topilmadi:', response.data);
          return ctx.reply(messages.playerNotFound[lang]);
        }
        
          const decodedNickname = decodeURIComponent(encodedNickname);
          console.log('✅ Nickname:', decodedNickname);

          ctx.session.tempOrder.gameId = gameId;
          ctx.session.tempOrder.zoneId = zoneId;
          ctx.session.tempOrder.nickname = decodedNickname; // saqlash uchun ham tozalangan variant

          ctx.session.step = 'awaiting_confirmation';

          // decodedNickname ishlatiladi
          let orderDetails = messages.isThisYou[lang].replace('{encodedNickname}', decodedNickname) + '\n\n';

          if (ctx.session.tempOrder.type === 'weekly_pack') {
            orderDetails += messages.weeklyPack[lang];
          } else {
            orderDetails += messages.diamondAmount[lang].replace('{amount}', ctx.session.tempOrder.amount);
          }

          orderDetails += messages.gameId[lang]
            .replace('{gameId}', gameId)
            .replace('{zoneId}', zoneId);

          return ctx.reply(orderDetails, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback(lang === 'ru' ? '✅ Да, подтверждаю' : '✅ Ha, tasdiqlayman', 'confirm_order')],
              [Markup.button.callback(lang === 'ru' ? '✏️ Изменить данные' : '✏️ Ma\'lumotlarni o‘zgartirish', 'edit_order')],
            ]),
          });

      } catch (error) {
        console.error('❌ Codashop nickname olishda xatolik:', error.response?.data || error.message);
        return ctx.reply(messages.serverError[lang]);
      }
    }

    if (ctx.session.step === 'awaiting_receipt') {
      console.log('🧾 Chek kutilyapti – bu bosqich uchun boshqa handler ishlaydi.');
      return ctx.reply(messages.awaitingReceiptNote[lang]);
    }
  });




  // 3. To‘lov usulini tanlash
  bot.action('confirm_order', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session = ctx.session || {};
    const lang = ctx.session.language || 'uz'; // tilni sessiondan olamiz

    if (
      !ctx.session.tempOrder ||
      !ctx.session.tempOrder.gameId ||
      !ctx.session.tempOrder.zoneId
    ) {
      const errorMsg = lang === 'ru'
        ? '❌ Данные заказа не найдены. Пожалуйста, попробуйте снова.'
        : '❌ Buyurtma ma’lumotlari topilmadi. Iltimos, qaytadan urinib ko‘ring.';
      return ctx.reply(errorMsg);
    }

    ctx.session.order = { ...ctx.session.tempOrder };
    ctx.session.tempOrder = null;
    ctx.session.step = null;

    const { amount, gameId, zoneId, nickname, type } = ctx.session.order;

    let orderText = lang === 'ru'
      ? `📥 Ваш заказ подтвержден:\n\n`
      : `📥 Buyurtmangiz tasdiqlandi:\n\n`;

    if (type === 'weekly_pack') {
      orderText += lang === 'ru'
        ? `- 🗓 Пакет: Еженедельный пропуск\n`
        : `- 🗓 Paket: Haftalik propusk\n`;
    } else {
      orderText += lang === 'ru'
        ? `- 💎 Алмазы: ${amount} шт\n`
        : `- 💎 Almaz: ${amount} ta\n`;
    }

    orderText += lang === 'ru'
      ? `- 🎮 Game ID: \`${gameId}\`\n- 🌐 Zone ID: \`${zoneId}\`\n- 👤 Никнейм: *${nickname}*`
      : `- 🎮 Game ID: \`${gameId}\`\n- 🌐 Zone ID: \`${zoneId}\`\n- 👤 Nickname: *${nickname}*`;

    await ctx.reply(orderText, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(
            lang === 'ru' ? '💳 Оплатить картой' : '💳 Karta orqali to‘lov',
            'pay_by_card'
          )
        ]
      ])
    });
  });




  // 4. Karta orqali to‘lov → kompaniya kartasi + "Men to‘lovni amalga oshirdim" tugmasi
  bot.action('pay_by_card', async (ctx) => {
    await ctx.answerCbQuery();
    const lang = ctx.session?.language || 'uz';

    const texts = {
      uz: {
        info: `💳 *Bizning karta ma'lumotlari:*

  1. *Uzcard*  
    └ 💳 Karta raqami: \`5614 6819 0618 7046\`  
    └ 👤 Egasi: *BAXODIROV ISLOMBEK*

  2. *Uzum Visa*  
    └ 💳 Karta raqami: \`4916 9903 1534 5592\`  
    └ 👤 Egasi: *ISLOMBEK BAXODIROV*`,
        confirm: '✅ Men to‘lovni amalga oshirdim'
      },
      ru: {
        info: `💳 *Наши реквизиты для оплаты:*

  1. *Uzcard*  
    └ 💳 Номер карты: \`5614 6819 0618 7046\`  
    └ 👤 Владелец: *BAXODIROV ISLOMBEK*

  2. *Uzum Visa*  
    └ 💳 Номер карты: \`4916 9903 1534 5592\`  
    └ 👤 Владелец: *ISLOMBEK BAXODIROV*`,
        confirm: '✅ Я оплатил(а)'
      }
    };

    await ctx.reply(texts[lang].info, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback(texts[lang].confirm, 'paid_confirm')]
      ])
    });
  });


  // 5. "Men to‘lovni amalga oshirdim" → kvitansiya rasmini so‘rash
  bot.action('paid_confirm', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.step = 'awaiting_receipt';

    const lang = ctx.session?.language || 'uz';

    const texts = {
      uz: '🖼️ Iltimos, to‘lov kvitansiya screenshot rasmini yuboring.',
      ru: '🖼️ Пожалуйста, отправьте скриншот чека об оплате.'
    };

    await ctx.reply(texts[lang]);
  });



 
  bot.on(['photo', 'document'], async (ctx) => {
    if (ctx.session.step !== 'awaiting_receipt') return;

    const lang = ctx.session?.language || 'uz';

    if (ctx.session.receiptReceived) {
      return ctx.reply(
        lang === 'ru'
          ? '❌ Вы уже отправили изображение. Пожалуйста, подождите.'
          : '❌ Siz allaqachon rasm yubordingiz. Iltimos, kuting.'
      );
    }

    if (ctx.message.media_group_id) {
      return ctx.reply(
        lang === 'ru'
          ? '❌ Пожалуйста, отправьте изображение *отдельно*, а не как альбом.'
          : '❌ Iltimos, rasmni albom (guruh) sifatida emas, *alohida* yuboring.',
        { parse_mode: 'Markdown' }
      );
    }

    let fileId;

    if (ctx.message.photo) {
      fileId = ctx.message.photo.at(-1).file_id;
    } else if (ctx.message.document) {
      const mime = ctx.message.document.mime_type;
      if (!mime.startsWith('image/')) {
        return ctx.reply(
          lang === 'ru'
            ? '❌ Пожалуйста, отправьте только изображение.'
            : '❌ Iltimos, faqat rasm fayli yuboring.'
        );
      }
      fileId = ctx.message.document.file_id;
    }

    if (!fileId) {
      return ctx.reply(
        lang === 'ru'
          ? '❌ Изображение не найдено.'
          : '❌ Rasm topilmadi.'
      );
    }

    ctx.session.receiptReceived = true;

    const server = ctx.session.order?.server || ctx.session.server;
    const til = ctx.session.language || order.language || 'uz';


    const { amount, gameId, zoneId, nickname, type } = ctx.session.order || {};
    const firstName = ctx.from.first_name || 'Безымянный';
    const username = ctx.from.username ? `@${ctx.from.username}` : (lang === 'ru' ? 'Username нет' : 'Username yo‘q');
    const userId = ctx.from.id;

    let caption =
      `🆕 *${lang === 'ru' ? 'Новый заказ' : 'Yangi buyurtma'}:*\n`;

    if (type === 'weekly_pack') {
      caption += `- 🗓 ${lang === 'ru' ? 'Пакет: Weekly Pass' : 'Paket: Haftalik propusk'}\n`;
    } else {
      caption += `- 💎 ${lang === 'ru' ? `Алмазы: ${amount} шт.` : `Almaz: ${amount} ta`}\n`;
    }

    caption +=
      `- 🎮 Game ID: \`${gameId}\`\n` +
      `- 🌐 Zone ID: \`${zoneId}\`\n` +
      `- 🔰 MLBB nickname: \`${nickname}\`\n` +
      `- 🌐 Сервер: ${server || 'Неизвестно'}\n` +
      `- 👤 ТГ Имя: ${firstName}\n` +
      `- 🆔 ТГ Username: ${username}\n` +
      `- 🧾 Telegram ID: \`${userId}\``+
      `- 🧾 til: \`${til}\``


    await bot.telegram.sendPhoto(process.env.ADMIN_CHANNEL_ID, fileId, {
      caption,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(
            lang === 'ru' ? '✅ Подтвердить' : '✅ Tasdiqlash',
            `approve_${userId}`
          ),
          Markup.button.callback(
            lang === 'ru' ? '❌ Отклонить' : '❌ Bekor qilish',
            `reject_${userId}`
          )
        ]
      ])
    });

    // Sessionni tozalamasdan, faqat tilni aniqlash
    ctx.session = {};

    await ctx.reply(
      lang === 'ru'
        ? '🔎 Админы проверяют ваш заказ. Мы скоро ответим.'
        : '🔎 Adminlar buyurtmangizni tekshirmoqda. Tez orada javob beramiz.'
    );
  });



  // 4) “✅ Tasdiqlash” tugmasi bosilganda
  bot.action(/approve_(\d+)/, async (ctx) => {
    try {
      console.log('✅ Tasdiqlash tugmasi bosildi');
      await ctx.answerCbQuery();

      const userId = Number(ctx.match[1]);
      console.log('User ID:', userId);

      const adminChatId = ctx.chat.id;
      const adminMsgId = ctx.update.callback_query.message.message_id;
      const origCaption = ctx.update.callback_query.message.caption || '';
      console.log('Admin chat ID:', adminChatId);
      console.log('Admin message ID:', adminMsgId);
      console.log('Original caption:', origCaption);

      // caption ichidan tilni olish
      const languageMatch = origCaption.match(/- 🧾 til: (\w+)/);
      const language = languageMatch ? languageMatch[1] : 'uz';
      console.log('Til captiondan olindi:', language);

      const approvedMessages = {
        uz: '✅ Buyurtmangiz tasdiqlandi!\n\n⏳ 1 daqiqadan 15 daqiqagacha hisobingizga tushadi. Tushganidan so‘ng bot orqali sizga xabar yuboriladi.',
        ru: '✅ Ваш заказ подтвержден!\n\n⏳ Алмазы поступят на ваш аккаунт в течение 1–15 минут. После зачисления вы получите уведомление от бота.'
      };

      console.log('Foydalanuvchiga xabar yuborilmoqda...');
      await bot.telegram.sendMessage(userId, approvedMessages[language]);
      console.log('Foydalanuvchiga xabar yuborildi:', language);

      // Xabarni yangilash (kanalda)
      console.log('Admin kanalidagi xabarni yangilash boshlanmoqda...');
      await bot.telegram.editMessageCaption(
        adminChatId,
        adminMsgId,
        null,
        origCaption + '\n\n✅ *Tasdiqlandi*',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📥 Almaz tushdi', `delivered_${userId}`)]
          ])
        }
      );
      console.log('Admin kanalidagi xabar yangilandi');
    } catch (error) {
      console.error('Tasdiqlash xatoligi:', error);
    }
  });



  // 5) “❌ Atmen” tugmasi bosilganda
  bot.action(/reject_(\d+)/, async (ctx) => {
    try {
      console.log('❌ Rad etish tugmasi bosildi');
      await ctx.answerCbQuery();

      const userId = Number(ctx.match[1]);
      console.log('User ID:', userId);

      const adminChatId = ctx.chat.id;
      const adminMsgId = ctx.update.callback_query.message.message_id;
      const origCaption = ctx.update.callback_query.message.caption || '';
      console.log('Original caption:', origCaption);

      // Tilni caption ichidan olish
      const languageMatch = origCaption.match(/- 🧾 til: (\w+)/);
      const lang = languageMatch ? languageMatch[1] : 'uz';
      console.log('Til captiondan olindi:', lang);

      const rejectText = lang === 'ru'
        ? '❌ К сожалению, ваш заказ *отклонен*.\n\n' +
          '*Возможные причины:*\n' +
          '• Оплата не поступила на наш счет.\n' +
          '• Квитанция недостаточно четкая или поддельная.\n\n' +
          '📩 Пожалуйста, свяжитесь с админом для уточнения ситуации: @MLStoreSupport\n' +
          '‼️ Пока НЕ ДЕЛАЙТЕ повторную оплату.'
        : '❌ Afsus, buyurtmangiz hozircha *rad etildi*.\n\n' +
          '*Ehtimoliy sabablari:*\n' +
          '• To‘lov bizning hisobimizga tushmagan.\n' +
          '• Yuborgan kvitansiyangizda aniqlik yetishmayapti yoki u haqiqiy emas.\n\n' +
          '📩 Iltimos, holatni aniqlashtirish uchun admin bilan bog‘laning: @MLStoreSupport\n' +
          '‼️ Hozircha qayta to‘lov QILMANG.';

      // const supportBtn = lang === 'ru' ? '🛠 Тех. поддержка' : '🛠 Tex. yordam';

      await bot.telegram.sendMessage(userId, rejectText, {

      });

      await bot.telegram.editMessageCaption(
        adminChatId,
        adminMsgId,
        null,
        origCaption + (lang === 'ru' ? '\n\n❌ *Отклонено*' : '\n\n❌ *Rad etildi*'),
        { parse_mode: 'Markdown' }
      );
      console.log('Rad etish xabari yuborildi va xabar yangilandi');
    } catch (error) {
      console.error('Rad etish xatoligi:', error);
    }
  });




  // ✅ Almaz tushdi tugmasi bosilganda
  bot.action(/delivered_(\d+)/, async (ctx) => {
    try {
      await ctx.answerCbQuery();

      const userId = Number(ctx.match[1]);
      const adminChatId = ctx.chat.id;
      const adminMsgId = ctx.update.callback_query.message.message_id;
      const origCaption = ctx.update.callback_query.message.caption || '';
      console.log('Original caption:', origCaption);

      // Tilni caption ichidan olish
      const languageMatch = origCaption.match(/- 🧾 til: (\w+)/);
      const lang = languageMatch ? languageMatch[1] : 'uz';
      console.log('Til captiondan olindi:', lang);

      const userMessage = lang === 'ru'
        ? '✅ Ваш заказ успешно выполнен!\n\nВыбранный пакет зачислен на ваш счет.\n\nЕсли вы довольны нашим сервисом — пожалуйста, оставьте отзыв в нашем официальном канале. Это поможет нам улучшить качество услуг!\n\n👇 Нажмите кнопку ниже, чтобы оставить отзыв.'
        : '✅ Buyurtmangiz muvaffaqiyatli bajarildi!\n\nSiz tanlagan paket hisobingizga tushirildi.\n\nAgar xizmatimizdan mamnun bo‘lsangiz — iltimos, rasmiy kanalimizda fikr qoldiring. Bu bizga yanada yaxshiroq xizmat ko‘rsatishda yordam beradi!\n\n👇 Fikr bildirish uchun quyidagi tugmani bosing.';

      const feedbackButtonText = lang === 'ru' ? '📝 Оставить отзыв' : '📝 Fikr qoldirish';

      await bot.telegram.sendMessage(
        userId,
        userMessage,
        Markup.inlineKeyboard([
          Markup.button.url(feedbackButtonText, 'https://t.me/MLStoreOfficial_chat/6')
        ])
      );

      await bot.telegram.editMessageCaption(
        adminChatId,
        adminMsgId,
        null,
        origCaption + (lang === 'ru' ? '\n\n📥 *Алмазы зачислены*' : '\n\n📥 *Almaz tushdi*'),
        { parse_mode: 'Markdown' }
      );
      console.log('Almaz tushdi xabari yuborildi va xabar yangilandi');
    } catch (error) {
      console.error('Almaz tushdi bosilganda xatolik:', error);
    }
  });





  // Matn yuborsa xato chiqarsin
  bot.on('message', async (ctx) => {
    const lang = ctx.session?.language || 'uz';

    if (ctx.session?.step === 'awaiting_receipt') {
      if (!ctx.message.photo && !ctx.message.document) {
        const errorMsg =
          lang === 'ru'
            ? '❌ Пожалуйста, отправьте скриншот. Текст не принимается.'
            : '❌ Iltimos, rasm yuboring. Matn yuborilmaydi.';
        return ctx.reply(errorMsg);
      }
    }
  });

  // 7. Ma'lumotlarni qayta kiritish
  bot.action('edit_order', async (ctx) => {
    const lang = ctx.session?.language || 'uz';

    await ctx.answerCbQuery();
    ctx.session.step = 'awaiting_full_id';

    const message =
      lang === 'ru'
        ? '✏️ Пожалуйста, отправьте новый *Game ID* и *Zone ID*.\n\n📌 *Например:* `123456789 (1234)`'
        : '✏️ Yangi *Game ID* va *Zone ID* ni yuboring.\n\n📌 *Masalan:* `123456789 (1234)`';

    await ctx.reply(message, { parse_mode: 'Markdown' });
  });

};