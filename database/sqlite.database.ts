import sqlite3, { RunResult } from 'sqlite3';

class SQLiteDB {
  db: sqlite3.Database;
  constructor() {
    this.db = new sqlite3.Database('./database/testDB.db');
  }

  public async createEntity(tablename: string, columns: any[], values: any[]) : Promise<RunResult> {
    return await new Promise((resolve, reject) => {

      this.db.serialize(() => {
        this.db.run(`INSERT INTO ${tablename} (author) VALUES (${"?".repeat(columns.length).split("").join(",")})`, values, async function (err: Error) {
          const runResult: RunResult = this
          if (!err) {
            resolve(runResult)
          } else {
            console.log('error')
            reject(runResult)
          }
        });

        /*db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
            console.log(row.id + ": " + row.info);
        });*/
      });
    })
  }

}

export default new SQLiteDB()