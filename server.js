import 'dotenv/config';
import { Telegraf } from 'telegraf';
import mongoose from 'mongoose';
import User from './models/User.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bot = new Telegraf(process.env.BOT_TOKEN);
const sessions = {};

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB ulandi"))
  .catch(err => console.error("MongoDB ulanmadi", err));

bot.start(async (ctx) => {
  const telegramId = String(ctx.from.id);
  const existingUser = await User.findOne({ telegramId });

  if (existingUser) {
    return ctx.reply("Siz avval ro‘yxatdan o‘tgansiz.");
  }

  const name = ctx.from.first_name || "Nomaʼlum";
  sessions[telegramId] = { step: 'get_phone', name };

  return ctx.reply("Iltimos telefon raqamingizni yuboring (raqamni yozing yoki pastdan ulashing):", {
    reply_markup: {
      keyboard: [[{ text: "Raqamni ulashish", request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.on('contact', async (ctx) => {
  const telegramId = String(ctx.from.id);
  const userSession = sessions[telegramId];

  if (!userSession || userSession.step !== 'get_phone') {
    return ctx.reply("Iltimos /start buyrug‘ini bosing.");
  }

  const contact = ctx.message.contact;

  const user = new User({
    telegramId,
    username: ctx.from.username || "",
    name: userSession.name,
    phoneNumber: contact.phone_number
  });

  await user.save();

  userSession.step = 'select_os';

  await ctx.reply("Raqamingiz saqlandi. Endi operatsion tizimingizni tanlang:", {
    reply_markup: {
      remove_keyboard: true,
      inline_keyboard: [
        [{ text: "🪟 Windows", callback_data: 'os_windows' }],
        [{ text: "🟠 Ubuntu", callback_data: 'os_ubuntu' }],
        [{ text: "🍎 macOS", callback_data: 'os_macos' }]
      ]
    }
  });
});

bot.on('text', async (ctx) => {
  const telegramId = String(ctx.from.id);
  const userSession = sessions[telegramId];

  if (!userSession) return;

  if (userSession.step === 'get_phone') {
    const phoneNumber = ctx.message.text.trim();

    if (!/^(\+?\d{9,15})$/.test(phoneNumber)) {
      return ctx.reply("Iltimos, to‘g‘ri telefon raqamini yuboring yoki raqamni ulashish tugmasidan foydalaning.");
    }

    const user = new User({
      telegramId,
      username: ctx.from.username || "",
      name: userSession.name,
      phoneNumber
    });

    await user.save();

    userSession.step = 'select_os';

    await ctx.reply("Raqamingiz saqlandi. Endi operatsion tizimingizni tanlang:", {
      reply_markup: {
        remove_keyboard: true,
        inline_keyboard: [
          [{ text: "🪟 Windows", callback_data: 'os_windows' }],
          [{ text: "🟠 Ubuntu", callback_data: 'os_ubuntu' }],
          [{ text: "🍎 macOS", callback_data: 'os_macos' }]
        ]
      }
    });
  }
});

bot.on('callback_query', async (ctx) => {
  const telegramId = String(ctx.from.id);
  const userSession = sessions[telegramId];

  if (!userSession || userSession.step !== 'select_os') {
    return ctx.answerCbQuery("Iltimos, avval ro‘yxatdan o‘ting.");
  }

  const os = ctx.callbackQuery.data.replace('os_', '');

  const fileExtensions = {
    windows: 'ps1',  // Windows uchun PowerShell skript
    ubuntu: 'sh',
    macos: 'sh',
  };

  const ext = fileExtensions[os] || 'sh';
  const filePath = join(__dirname, 'files', `${os}.${ext}`);

  try {
    await ctx.replyWithDocument({ source: filePath });
    delete sessions[telegramId];
    await ctx.answerCbQuery(`Tanlangan: ${os}`);
  } catch (err) {
    console.error("Fayl yuborishda xatolik:", err);
    await ctx.reply("Kechirasiz, faylni yuborishda xatolik yuz berdi.");
    await ctx.answerCbQuery();
  }
});

bot.launch();
