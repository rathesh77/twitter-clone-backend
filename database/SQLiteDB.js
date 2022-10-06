const sqlite3 = require('sqlite3').verbose();

class SQLiteDB {
  constructor() {
    this.db = new sqlite3.Database('./database/testDB.db');
  }
}

module.exports = new SQLiteDB()