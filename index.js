// pakages
const { Telegraf } = require("telegraf");
const dotenv = require("dotenv");
const db = require("./db");
const regex = require("url-regex");
const urlRegex = require("url-regex");

// env config
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

bot.hears(urlRegex(), async (ctx) => {
  // get urls from texts
  const urls = ctx.message.text.match(urlRegex());
  const firstUrl = urls[0];

  // get userId
  const userId = ctx.from.id;
  const currentCollection = await db.find({ userId: ctx.from.id });

  console.log(currentCollection);

  ctx.reply(`Link saved`);
});

// start bot
bot.launch();
