// pakages
const { Telegraf, Markup, Extra } = require('telegraf');
const dotenv = require('dotenv');
const urlRegex = require('url-regex');
const fetch = require('node-fetch');
const ent = require('ent');
const db = require('./db');
const _ = require('lodash');

// env config
dotenv.config({ path: '.env' });

// initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// regexs
const titleRegex = /<title>(.+)<\/title>/gim;

// memory storage
const memoryStore = {};

// categories lists
const categories = [
  'Articles & News',
  'Releases',
  'Libs and Demos',
  'Silly stuff',
];

// helper functions
const sanitizeTitle = title => title.replace(/[\n\r\t]+/gm, ' ');

const generateMarkdown = async categories => {
  let markdown;

  await db.find({}, (err, doc) => {
    const links = doc[0].links;

    //group links by categories
    const groupedLinks = _.groupBy(links, it => it.category);

    markdown = categories
      .map(category => {
        const header = `\n## ${category}\n`;
        const links = groupedLinks[category]
          ? groupedLinks[category]
              .map(link => `- [${sanitizeTitle(link.title)}](${link.url})\n`)
              .reduce((acc, val) => acc + val, '')
          : `- No links yet \n`;

        return `${header}${links}`;
      })
      .reduce((acc, val) => acc + val, '');
  });

  return markdown;
};

// masic messages initializations
const welcomeMessage = `Welcome to back up bot..!  
Send me a link... I promise to keep it safe`;
const helpTxt = `Send me a link`;

// basic commands
bot.start(ctx => ctx.reply(welcomeMessage));
bot.help(ctx => ctx.reply(helpTxt));

// listen commands
bot.on('sticker', ctx => ctx.reply('👍'));

bot.hears(/new collection (.+)/i, async ctx => {
  const userId = ctx.from.id;
  const collectionName = ctx.match[1];

  // remove all old episodes
  await db.remove({ userId }, { multi: true });

  // create a new episode
  await db.insert({ userId, collectionName, links: [] });

  ctx.reply(`New collection created with name: ${collectionName}`);
});

bot.hears(urlRegex(), async ctx => {
  // get urls from texts
  const urls = ctx.message.text.match(urlRegex());
  const firstUrl = urls[0];

  // get url title
  const body = await fetch(firstUrl).then(r => r.text());
  const titleTag = body.match(titleRegex);

  const title = ent.decode(
    titleTag.pop().replace('<title>', '').replace('</title>', '')
  );

  // get userId
  const userId = ctx.from.id;
  memoryStore[userId] = { url: firstUrl, title, category: '' };

  // find and update current episode
  /*
  await db.update(
    { userId },
    { $push: { links: { url: firstUrl, title, category: '' } } }
  );
*/

  ctx.reply(
    `Ready to save: "${title}".
  What category should it be?`,
    Markup.keyboard(categories).oneTime().resize()
  );
});

// categories handling
categories.forEach(category => {
  bot.hears(category, async ctx => {
    const userId = ctx.from.id;
    const linkObject = memoryStore[userId]; // { url: firstUrl, title, category: '' };
    linkObject.category = category;

    // find and update current episode

    await db.update({ userId }, { $push: { links: linkObject } });

    ctx.reply(`Saved link into "${category}": ${memoryStore[userId].title}`);
  });
});

bot.hears(/generate markdown/i, async ctx => {
  const userId = ctx.from.userId;

  let markdown;
  await db.find({}, (err, doc) => {
    const links = doc[0].links;

    // group links by category

    const groupedLinks = _.groupBy(links, it => it.category);

    markdown = categories
      .map(category => {
        const header = `\n## ${category}\n`;
        const links = groupedLinks[category]
          ? groupedLinks[category]
              .map(link => ` - [${sanitizeTitle(link.title)}](${link.url})\n`)
              .reduce((acc, val) => acc + val, '')
          : `- No links yet \n`;
        return `${header}${links}`;
      })
      .reduce((acc, val) => acc + val, '');

    ctx.reply(markdown);
  });
});

bot.hears(/generate preview/i, async ctx => {
  let markdown;
  await db.find({}, (err, doc) => {
    const links = doc[0].links;

    // group links by category

    const groupedLinks = _.groupBy(links, it => it.category);

    markdown = categories
      .map(category => {
        const header = `\n## ${category}\n`;
        const links = groupedLinks[category]
          ? groupedLinks[category]
              .map(link => ` - [${sanitizeTitle(link.title)}](${link.url})\n`)
              .reduce((acc, val) => acc + val, '')
          : `- No links yet \n`;
        return `${header}${links}`;
      })
      .reduce((acc, val) => acc + val, '');

    ctx.replyWithMarkdown(markdown);
  });
});

// start bot
bot.launch();
