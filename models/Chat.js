const SQLiteDB = require('../database/SQLiteDB')
const db = SQLiteDB.db

class Chat {

    static async create(data) {
        return await this.createChat(data)
    }

    static async createChat(data) {
        console.log(data)
        return new Promise((resolve, reject) => {
            const authorId = data.author.uid
            const recipients = data.recipients
            const content = data.content
            const createMessage = this.createMessage
            try {
                db.serialize(() => {
                    db.run("INSERT INTO chat (author) VALUES (?)", [authorId], async function (err) {
                        const chatId = this.lastID
                        if (!err) {
                            db.run("INSERT INTO UserChat (idChat, idUser) VALUES (?, ?)", [chatId, authorId])
                            for (const recipient of recipients) {
                                const recipientId = recipient.uid
                                db.run("INSERT INTO UserChat (idChat, idUser) VALUES (?, ?)", [chatId, recipientId])
                            }
                            const messageId = await createMessage({
                                authorId: authorId, content, chatId
                            })
                            resolve({chatId, messageId})

                        } else {
                            console.log('error')
                            reject(-1)
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
        })
    }

    static async createMessage({ authorId, content, chatId }) {
        console.log(authorId, content, chatId)
        return new Promise((resolve, reject) => {
            try {
                db.serialize(() => {
                    db.run("INSERT INTO Message (content, idUser, idChat, date) VALUES (?, ?, ?, strftime('%s', 'now') * 1000)", [content, authorId, chatId], function (err) {
                        if (!err) {
                            console.log('lastId', this.lastID)
                            resolve(this.lastID)
                        } else {
                            console.log('error')
                            reject(err)
                        }
                    });

                });
            } catch (error) {
                console.error(`Something went wrong: ${error}`);
            } finally {
            }
        })
    }

    static async getChatsAndMessagesRelatedToUser(userId) {
        return new Promise((resolve, reject) => {
            try {
                db.serialize(() => {
                    db.all(`
                        select 
                            sub.chatId as chatId, 
                            uc.idUser,
                            m.content, 
                            m.id as messageId,
                            m.date
                        FROM
                            (
                            SELECT 
                               c.id as chatId
                            FROM 
                                chat AS c, userchat AS uc
                            WHERE 
                                uc.idUser = ? and uc.idChat = c.id
                            GROUP BY chatId) as sub
                            INNER JOIN UserChat as uc ON sub.chatId = uc.idChat
                            LEFT JOIN message as m ON uc.idChat = m.idChat and uc.idUser = m.idUser
                        ORDER BY
                                m.date asc
                            `, 
                    [userId], (err, rows) => {
                        // process the row here 
                        if (!err) {
                            resolve(rows)
                        } else {
                            reject(-1)
                        }
                    });
                });
            } catch (error) {
                console.error(`Something went wrong: ${error}`);
            } finally {
            }
        })
    }
}

module.exports = Chat