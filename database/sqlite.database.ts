import sqlite3, { RunResult } from 'sqlite3';

class SQLiteDB {

  db: sqlite3.Database;
  constructor() {
    this.db = new sqlite3.Database('./database/testDB.db');
  }

  public async createEntity(tablename: string, columns: string[], values: (string | number | undefined)[]): Promise<RunResult> {
    return await new Promise((resolve, reject) => {

      this.db.serialize(() => {
        this.db.run(`INSERT INTO ${tablename} (${columns.join(',')}) VALUES (${'?'.repeat(columns.length).split('').join(',')})`, values, async function (err: Error) {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const runResult: RunResult = this;
          if (!err) {
            resolve(runResult);
          } else {
            console.log('error');
            reject(runResult);
          }
        });

        /*db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
            console.log(row.id + ": " + row.info);
        });*/
      });
    });
  }

}

export default new SQLiteDB();