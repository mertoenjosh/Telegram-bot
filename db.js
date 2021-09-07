const Datastore = require("nedb");

const db = new Datastore({ filename: `database`, autoload: true });

module.exports = db;
