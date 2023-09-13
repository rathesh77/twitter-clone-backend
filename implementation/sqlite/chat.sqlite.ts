import { RunResult } from "sqlite3";
import sqliteDatabase from "../../database/sqlite.database";
import ChatInterface from "../../interface/chat.interface";

class ChatSqlite implements ChatInterface {
  async create(chatDto: ChatDto): Promise<RunResult> {

    const {userId} = chatDto
    return await sqliteDatabase.createEntity('chat', ["author"], [userId])
  }

  
  async getChatsAndMessagesRelatedToUser(userId: string): Promise<ChatMessageDto[]> {
    return await new Promise((resolve, reject) => {
      try {
        sqliteDatabase.db.serialize(() => {
          sqliteDatabase.db.all(`
                        select 
                            sub.chatId as chatId,
                            sub.userId as userId,  
                            uc.userId,
                            m.content, 
                            m.id as messageId,
                            m.date
                        FROM
                            (
                            SELECT 
                               c.id as chatId,
                               c.userId as userId
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
                    chatId:r.chatId,
                    messageId: r.messageId
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