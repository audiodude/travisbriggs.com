const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('comments.sqlite3');

db.run(
  'CREATE TABLE comments (id TEXT, host TEXT, username TEXT, page_slug TEXT)',
);
