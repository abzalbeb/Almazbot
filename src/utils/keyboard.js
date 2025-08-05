const { Markup } = require('telegraf');

function getMainMenu(lang = 'uz') {
  const buttons = {
    uz: {
      prices: '📋 Narxlar ro‘yxati',
      faq: '❓ Savollar',
      channel: '📢 Rasmiy kanal',
      support: '🛠 Tex. yordam',
      buy: '💎 Sotib olish',
      review: '⭐ Otziv',
      changeLang: '🌐 Tilni o‘zgartirish',
    },
    ru: {
      prices: '📋 Цены',
      faq: '❓ Вопросы',
      channel: '📢 Официальный канал',
      support: '🛠 Тех. поддержка',
      buy: '💎 Купить',
      review: '⭐ Отзыв',
      changeLang: '🌐 Сменить язык',
    }
  };

  const b = buttons[lang] || buttons.uz;

  return Markup.inlineKeyboard([
    [
      Markup.button.callback(b.prices, 'menu_prices'),
      Markup.button.callback(b.faq, 'menu_faq'),
    ],
    [
      Markup.button.callback(b.channel, 'menu_channel'),
      Markup.button.callback(b.support, 'menu_support'),
    ],
    [
      Markup.button.callback(b.buy, 'menu_diamonds'),
    ],
    [
      Markup.button.url(b.review, 'https://t.me/MLStoreOfficial_chat/6'),
      Markup.button.callback(b.changeLang, 'change_language')
    ]
  ]);
}

module.exports = { getMainMenu };
