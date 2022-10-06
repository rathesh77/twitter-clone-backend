const SQLiteDB = require('../database/SQLiteDB')
const {
    v4: uuidv4,
  } = require('uuid');
  
const db = SQLiteDB.db
  class Chat {
  
    static async create(data) {

        //const uid = uuidv4()
        const authorId = data.author.uid
        const recipients = data.recipients
        try {
            db.serialize(() => {
                db.run("INSERT INTO chat (author) VALUES (?)", [authorId], function(err) {
                    const lastId = this.lastID
                    if (!err) {
                        db.run("INSERT INTO UserChat (idChat, idUser) VALUES (?, ?)", [lastId, authorId])
                        for (const recipient of recipients) {
                            const recipientId = recipient.uid
                            db.run("INSERT INTO UserChat (idChat, idUser) VALUES (?, ?)", [lastId, recipientId])
                        }

                    } else {
                        console.log('error')
                    }
                });
            
                /*db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
                    console.log(row.id + ": " + row.info);
                });*/
            });
        } catch (error) {
            console.error(`Something went wrong: ${error}`);
        } finally {
        }
    }
  
  }
  
  module.exports = Chat