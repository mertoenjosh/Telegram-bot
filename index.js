// pakages
const { Telegraf } = require("telegraf");
const dotenv = require("dotenv");
const db = require("./db");
dotenv.config({ path: ".env" });

// initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// masic messages initializations
const welcomeMessage = `Welcome to back up bot..!  
Send me a link... I promise to keep it safe`;
const helpTxt = `Send me a link`;

// basic commands
bot.start((ctx) => ctx.reply(welcomeMessage));
bot.help((ctx) => ctx.reply(helpTxt));

// listen commands
bot.on("sticker", (ctx) => ctx.reply("👍"));

bot.hears(/new episode (.+)/, async (ctx) => {
  const userId = ctx.from.id;
  const episodeName = ctx.match[1];

  // remove all old episodes
  await db.remove({ userId }, { multi: true });
  // create a new episode
  await db.insert({ userId, episodeName, links: [] });

  ctx.reply(`new episode created with name: ${episodeName}`);
});

bot.hears(/http/i, (ctx) => {
  console.log(ctx.update.message.text);

  ctx.reply(`Link saved`);
});

// start bot
bot.launch();
