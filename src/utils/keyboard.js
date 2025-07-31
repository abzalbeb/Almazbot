const { Markup } = require('telegraf');

function getMainMenu() {
  return Markup.inlineKeyboard([
    [ // 1-qator: 2 ta tugma
      Markup.button.callback('📋 Narxlar ro‘yxati', 'menu_prices'),
      Markup.button.callback('❓ Savollar', 'menu_faq')
    ],
    [ // 2-qator: 2 ta tugma
      Markup.button.callback('📢 Rasmiy kanal', 'menu_channel'),
      Markup.button.callback('🛠 Tex. yordam', 'menu_support')
    ],
    [ // 3-qator: faqat "Sotib olish"
      Markup.button.callback('💎 Sotib olish', 'menu_diamonds')
    ],
        [ // 4-qator: otziv tugmasi — bu havola (callback emas!)
      Markup.button.url('⭐ Otziv', 'https://t.me/MLStoreOfficial_chat/6')
    ]
  ]);
}

module.exports = { getMainMenu };
