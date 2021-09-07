const { Telegraf } = require("telegraf");
const dotenv = require("dotenv");

dotenv.config({ path: ".env" });

const bot = new Telegraf(process.env.BOT_TOKEN);

// message initializations
const welcomeMessage = `Welcome to back up bot..!  
Send me a link... I promise to keep it safe`;

const helpTxt = `Send me a link`;

// basic commands
bot.start((ctx) => ctx.reply(welcomeMessage));
bot.help((ctx) => ctx.reply(helpTxt));

// listen commands
bot.on("sticker", (ctx) => ctx.reply("👍"));

bot.hears("new episode", (ctx) => {
  console.log(ctx.from);
  ctx.reply("new episode");
});

bot.launch();
