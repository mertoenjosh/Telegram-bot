// pakages
const { Telegraf, Markup } = require('telegraf');
const dotenv = require('dotenv');
const urlRegex = require('url-regex');
const fetch = require('node-fetch');
const ent = require('ent');
const db = require('./db');

// env config
dotenv.config({ path: '.env' });

// initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// regexs
const titleRegex = /<title>(.+)<\/title>/gim;

// memory storage
const memoryStore = {};

// masic messages initializations
const welcomeMessage = `Welcome to back up bot..!  
Send me a link... I promise to keep it safe`;
const helpTxt = `Send me a link`;

// basic commands
bot.start(ctx => ctx.reply(welcomeMessage));
bot.help(ctx => ctx.reply(helpTxt));

// listen commands
bot.on('sticker', ctx => ctx.reply('👍'));

bot.hears(/new episode (.+)/, async ctx => {
  const userId = ctx.from.id;
  const episodeName = ctx.match[1];

  // remove all old episodes
  await db.remove({ userId }, { multi: true });

  // create a new episode
  await db.insert({ userId, episodeName, links: [] });

  ctx.reply(`New episode created with name: ${episodeName}`);
});

bot.hears(urlRegex(), async ctx => {
  // get urls from texts
  const urls = ctx.message.text.match(urlRegex());
  const firstUrl = urls[0];

  // get url title
  const body = await fetch(firstUrl).then(r => r.text());
  const titleTag = body.match(titleRegex);
  console.log(titleTag);
  const title = ent.decode(
    titleTag.pop().replace('<title>', '').replace('</title>', '')
  );

  // get userId
  const userId = ctx.from.id;
  memoryStore[userId] = { url: firstUrl, title, category: '' };

  /*
  await db.update(
    { userId },
    { $push: { links: { url: firstUrl, title, category: '' } } }
  );
*/

  ctx.reply(
    `Ready to save: "${title}".
  What category should it be?`,
    Markup.keyboard(['/Articles', '/Releases', '/Lib', '/Silly'])
      .oneTime()
      .resize()
    //   .extra()
  );
});

bot.hears('/article', async ctx => {
  const userId = ctx.from.id;
  //   memoryStore[userId] = { url: firstUrl, title, category: '' };

  ctx.reply(`Saving link: ${memoryStore[userId].title}`);
});

// start bot
bot.launch();
