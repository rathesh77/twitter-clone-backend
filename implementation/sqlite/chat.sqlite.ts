import { RunResult } from "sqlite3";
import sqliteDatabase from "../../database/sqlite.database";
import ChatInterface from "../../interface/chat.interface";

class ChatSqlite implements ChatInterface {

  async create(chat: ChatDto): Promise<RunResult> {
    const {authorId} = chat
    return await sqliteDatabase.createEntity('chat', ["author"], [authorId])
  }

  async getChatsAndMessagesRelatedToUser(userId: number): Promise<ChatMessageDto[]> {
    return await new Promise((resolve, reject) => {
      try {
        sqliteDatabase.db.serialize(() => {
          sqliteDatabase.db.all(`
                        select 
                            sub.chatId as chatId,
                            sub.authorId as authorId,  
                            uc.userId,
                            m.content, 
                            m.id as messageId,
                            m.date
                        FROM
                            (
                            SELECT 
                               c.id as chatId,
                               c.authorId as authorId
                            FROM 
                                chat AS c, userchat AS uc
                            WHERE 
                                uc.userId = ? and uc.chatId = c.id
                            GROUP BY chatId) as sub
                            INNER JOIN UserChat as uc ON sub.chatId = uc.chatId
                            LEFT JOIN message as m ON uc.chatId = m.chatId and uc.userId = m.userId
                        ORDER BY
                                m.date asc
                            `,
            [userId], (err, rows) => {
              // process the row here 
              if (!err) {
                resolve(rows.map((r) => {
                  return new ChatMessageDto({
                    chat: { ...r },
                    message: { ...r }
                  });

                }))
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

export default ChatSqlite