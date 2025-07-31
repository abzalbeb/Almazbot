const { Markup } = require('telegraf');
const diamonds = require('../config/diamonds');
const axios = require('axios');

module.exports = function registerOrderActions(bot) {
  const ADMIN_CHANNEL_ID = parseInt(process.env.ADMIN_CHANNEL_ID, 10);

  // 1. Almaz tanlash va Game ID + Zone ID so‘rash
  bot.action(/order_\d+/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const index = Number(ctx.match[0].split('_')[1]);
      const selected = diamonds[index];

      if (!selected) {
        return ctx.reply('❌ Noto‘g‘ri tanlov.');
      }

      ctx.session = ctx.session || {};
      ctx.session.tempOrder = { ...selected };
      ctx.session.step = 'awaiting_full_id';

      await ctx.reply(
        `Iltimos, *Game ID* va *Zone ID* ni quyidagi formatda kiriting:\n\n📌 \`123456789 (1234)\`\n\n⚠️ *Server ID’sini unutmang!*`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('❌ order_x actionda xatolik:', err);
      ctx.reply('❌ Buyurtma bosqichida xatolik yuz berdi.');
    }
  });


  // 2. Game ID + Zone ID kiritish va Codashop orqali nickname olish
  bot.on('text', async (ctx) => {
    ctx.session = ctx.session || {};
    const input = ctx.message.text.trim();


    if (ctx.session.step === 'awaiting_full_id') {
      const match = input.match(/^(\d{5,15})\s*\((\d{2,6})\)$/);

      if (!match) {
        console.log('❗️Format xato:', input);
        return ctx.reply(
          '❌ Format noto‘g‘ri. Iltimos, *Game ID* va *Zone ID* ni quyidagi formatda yuboring:\n\n📌 `476595202 (2451)`',
          { parse_mode: 'Markdown' }
        );
      }

      const gameId = match[1];
      const zoneId = match[2];


      const payload = {
        country: 'sg',
        voucherTypeName: 'MOBILE_LEGENDS',
        whiteLabelId: '',
        userId: gameId,
        zoneId: zoneId,
        deviceId: '8afcdd63-fee2-4c6b-8a07-4c0efdfd5efa'
      };

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N)',
        'Origin': 'https://www.codashop.com',
        'Referer': 'https://www.codashop.com/id-id/mobile-legends'
      };

      try {

        const response = await axios.post(
          'https://order-sg.codashop.com/validate/',
          payload,
          { headers }
        );



        const nickname = response.data?.result?.username;

        if (!nickname) {
          console.log('❌ Nickname topilmadi:', response.data);
          return ctx.reply('❌ O‘yinchi topilmadi. Iltimos, Game ID va Zone ID ni tekshirib, qayta yuboring.');
        }

        // ✅ Nickname chiqdi
        ctx.session.tempOrder.gameId = gameId;
        ctx.session.tempOrder.zoneId = zoneId;
        ctx.session.tempOrder.nickname = nickname;
        
        ctx.session.step = 'awaiting_confirmation';



        return ctx.reply(
          `🔍 Topilgan nickname: *${nickname}*\n\nBu sizmisiz?\n\n📦 *Buyurtma tafsilotlari:*\n- 💎 Almaz: ${ctx.session.tempOrder.amount} ta\n- 🎮 Game ID: \`${gameId}\`\n- 🌐 Zone ID: \`${zoneId}\``,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('✅ Ha, tasdiqlayman', 'confirm_order')],
              [Markup.button.callback('✏️ Ma\'lumotlarni o‘zgartirish', 'edit_order')]
            ])
          }
        );
      } catch (error) {
        console.error('❌ Codashop nickname olishda xatolik:', error.response?.data || error.message);
        return ctx.reply('❌ Server bilan bog‘lanishda xatolik yuz berdi. Keyinroq urinib ko‘ring.');
      }
    }

    if (ctx.session.step === 'awaiting_receipt') {
      console.log('🧾 Chek kutilyapti – bu bosqich uchun boshqa handler ishlaydi.');
      return;
    }
  });



  // 3. To‘lov usulini tanlash
  bot.action('confirm_order', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session = ctx.session || {};

    if (
      !ctx.session.tempOrder ||
      !ctx.session.tempOrder.gameId ||
      !ctx.session.tempOrder.zoneId
    ) {
      return ctx.reply('❌ Buyurtma ma’lumotlari topilmadi. Iltimos, qaytadan urinib ko‘ring.');
    }

    ctx.session.order = { ...ctx.session.tempOrder };
    ctx.session.tempOrder = null;
    ctx.session.step = null;

    const { amount, gameId, zoneId, nickname } = ctx.session.order;

    await ctx.reply(
      `📥 Buyurtmangiz tasdiqlandi:\n\n- 💎 Almaz: ${amount} ta\n- 🎮 Game ID: \`${gameId}\`\n- 🌐 Zone ID: \`${zoneId}\`\n- 👤 Nickname: *${nickname}*\n\n⏳ Iltimos, to‘lov usulini tanlang.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💳 Karta orqali to‘lov', 'pay_by_card')]
        ])
      }
    );
  });


  // 4. Karta orqali to‘lov → kompaniya kartasi + "Men to‘lovni amalga oshirdim" tugmasi
  bot.action('pay_by_card', async (ctx) => {
    await ctx.answerCbQuery();

        await ctx.reply(
          `💳 *Bizning karta ma'lumotlari:*

      1. *Uzcard*  
        └ 💳 Karta raqami: \`5614 6819 0618 7046\`  
        └ 👤 Egasi: *BAXODIROV ISLOMBEK*

      2. *Uzum Visa*  
        └ 💳 Karta raqami: \`4916 9903 1534 5592\`  
        └ 👤 Egasi: *ISLOMBEK BAXODIROV*`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ Men to‘lovni amalga oshirdim', 'paid_confirm')]
        ])
      }
    );
  });

  // 5. "Men to‘lovni amalga oshirdim" → kvitansiya rasmini so‘rash
  bot.action('paid_confirm', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.step = 'awaiting_receipt';
    await ctx.reply('🖼️ Iltimos, to‘lov kvitansiya screenshot rasmini yuboring.');
  });


  // 1) Photo yoki document kelganda
  bot.on(['photo', 'document'], async (ctx) => {
    if (ctx.session.step !== 'awaiting_receipt') return;

    // ⛔ Ruxsat berilganidan keyin boshqa rasm yuborishni bloklash
    if (ctx.session.receiptReceived) {
      return ctx.reply('❌ Siz allaqachon rasm yubordingiz. Iltimos, kuting.');
    }

    if (ctx.message.media_group_id) {
      return ctx.reply('❌ Iltimos, rasmni albom (guruh) sifatida emas, *alohida* yuboring.', {
        parse_mode: 'Markdown'
      });
    }

    let fileId;

    if (ctx.message.photo) {
      fileId = ctx.message.photo.at(-1).file_id;
    } else if (ctx.message.document) {
      const mime = ctx.message.document.mime_type;
      if (!mime.startsWith('image/')) {
        return ctx.reply('❌ Iltimos, faqat rasm fayli yuboring.');
      }
      fileId = ctx.message.document.file_id;
    }

    if (!fileId) {
      return ctx.reply('❌ Rasm topilmadi.');
    }

    // ✅ Shu yerdan keyin boshqa rasmni qabul qilmasligi uchun flag o‘rnatamiz
    ctx.session.receiptReceived = true;
    

    // Buyurtma ma’lumotlarini olish
    const { amount, gameId, zoneId, nickname} = ctx.session.order;
    const firstName = ctx.from.first_name || 'Безымянный';
    const username = ctx.from.username ? `@${ctx.from.username}` : 'Username нет';
    const userId = ctx.from.id;


    // Admin kanaliga yuborish
        await bot.telegram.sendPhoto(process.env.ADMIN_CHANNEL_ID, fileId, {
          caption:
            `🆕 *Новый заказ:*\n` +
            `- 💎 Алмазы: ${amount} шт.\n` +
            `- 🎮 Game ID: \`${gameId}\`\n` +
            `- 🌐 Zone ID: \`${zoneId}\`\n` +
            `- 🔰 MLBB nickname: \`${nickname}\`\n` +
            `- 👤 ТГ Имя: ${firstName}\n` +
            `- 🆔 ТГ Username: ${username}\n` +
            `- 🧾 Telegram ID: \`${userId}\``,
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ Подтвердить', `approve_${userId}`),
              Markup.button.callback('❌ Отклонить', `reject_${userId}`)
            ]
          ])
        });


    // ❌ Sessionni butunlay o‘chirib tashlaymiz
    ctx.session = null;
    console.log(`Session foydalanuvchi uchun tozalandi: ${ctx.from.id}`);


    // Foydalanuvchiga javob
    await ctx.reply('🔎 Adminlar ko‘rib chiqmoqda. Tez orada javob beramiz.');
  });



  // // 4) “✅ Tasdiqlash” tugmasi bosilganda
  bot.action(/approve_(\d+)/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const userId = Number(ctx.match[1]);
      const adminChatId = ctx.chat.id;
      const adminMsgId = ctx.update.callback_query.message.message_id;
      const origCaption = ctx.update.callback_query.message.caption || '';

      // Foydalanuvchiga xabar
      await bot.telegram.sendMessage(
        userId,
        '✅ Buyurtmangiz tasdiqlandi!\n\n⏳ Almaz 1 daqiqadan 10 daqiqagacha hisobingizga tushadi. Tushganidan so‘ng bot orqali sizga xabar yuboriladi.'
      );


      // Xabarni yangilash (kanalda)
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
    } catch (error) {
      console.error('Tasdiqlash xatoligi:', error);
    }
  });


  // 5) “❌ Atmen” tugmasi bosilganda
  bot.action(/reject_(\d+)/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
      const userId = Number(ctx.match[1]);
      const adminChatId = ctx.chat.id;
      const adminMsgId = ctx.update.callback_query.message.message_id;
      const origCaption = ctx.update.callback_query.message.caption || '';

      // Foydalanuvchiga xabar
      await bot.telegram.sendMessage(
        userId,
        `❌ Afsus, buyurtmangiz hozircha *rad etildi*.\n\n` +
          `*Ehtimoliy sabablari:*\n` +
          `• To‘lov bizning hisobimizga tushmagan.\n` +
          `• Yuborgan kvitansiyangizda aniqlik yetishmayapti yoki u haqiqiy emas.\n\n` +
          `📩 Iltimos, holatni aniqlashtirish uchun admin bilan bog‘laning.\n` +
          `‼️ Hozircha qayta to‘lov QILMANG.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🛠 Tex. yordam', 'menu_support')]
          ])
        }
      );

      // Xabarni yangilash (kanalda)
      await bot.telegram.editMessageCaption(
        adminChatId,
        adminMsgId,
        null,
        origCaption + '\n\n❌ *Rad etildi*',
        { parse_mode: 'Markdown' }
      );
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

      // Foydalanuvchiga xabar
      await bot.telegram.sendMessage(
        userId,
        '✅ Buyurtmangiz muvaffaqiyatli bajarildi!\n\n💎 Almazlar hisobingizga tushirildi.\n\nAgar xizmatimizdan mamnun bo‘lsangiz — iltimos, rasmiy kanalimizda fikr qoldiring. Bu bizga yanada yaxshiroq xizmat ko‘rsatishda yordam beradi!\n\n👇 Fikr bildirish uchun quyidagi tugmani bosing.',
          Markup.inlineKeyboard([
            Markup.button.url('📝 Fikr qoldirish', 'https://t.me/MLStoreOfficial_chat/6')
          ])
      );

      // Xabarni yangilash (kanalda)
      await bot.telegram.editMessageCaption(
        adminChatId,
        adminMsgId,
        null,
        origCaption + '\n\n📥 *Almaz tushdi*',
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Almaz tushdi bosilganda xatolik:', error);
    }
  });



  // Matn yuborsa xato chiqarsin
  bot.on('message', async (ctx) => {
    if (ctx.session?.step === 'awaiting_receipt') {
      if (!ctx.message.photo && !ctx.message.document) {
        return ctx.reply('❌ Iltimos, rasm yuboring . Matn yuborilmaydi.');
      }
    }
  });

  // 7. Ma'lumotlarni qayta kiritish
  bot.action('edit_order', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.step = 'awaiting_full_id';
    await ctx.reply(
      `✏️ Yangi *Game ID* va *Zone ID* ni yuboring.\n\n📌 *Masalan:* \`123456789 (1234)\``,
      { parse_mode: 'Markdown' }
    );
  });
};