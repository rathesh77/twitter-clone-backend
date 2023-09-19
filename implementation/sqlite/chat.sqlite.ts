import { RunResult } from "sqlite3";
import sqliteDatabase from "../../database/sqlite.database";
import ChatInterface from "../../interface/chat.interface";
import ChatDto, { Recipient } from "../../models/dto/chat.dto";
import MessageDto from "../../models/dto/message.dto";
import ChatRequest from "../../models/request/chat.request";

class ChatSqlite implements ChatInterface {
  async create(chatDto: ChatRequest): Promise<RunResult> {
    const {userId} = chatDto
    const createdChat = await sqliteDatabase.createEntity('chat', ["userId"], [userId]) 
    return createdChat
  }

  async findById(id: number): Promise<ChatDto> {
    return await new Promise((resolve, reject) => {
      try {
        sqliteDatabase.db.serialize(() => {
          sqliteDatabase.db.all(`
          select 
          chat.userId as ChatAuthorId,
          sub.chatId as chatId,
          sub.userId as userId,  
          uc.userId as messageSenderId,
          m.content, 
          m.id as messageId,
          m.date
      FROM
      chat inner join 
          (
          SELECT 
             c.id as chatId,
             c.userId as userId
          FROM 
              chat AS c, userchat AS uc
          WHERE 
              uc.chatId = c.id
              and c.id = ?
          GROUP BY chatId) as sub on sub.chatId = chat.id
          INNER JOIN UserChat as uc ON sub.chatId = uc.chatId
          LEFT JOIN message as m ON uc.chatId = m.chatId and uc.userId = m.userId
      ORDER BY
              m.date asc`,
            [id], (err, rows) => {
              // process the row here 
              if (!err) {
                let recipients = new Set<Recipient>()
                let messages : MessageDto []= []
                let ChatAuthorId: string | null = null
                for (const row of rows) {
                  recipients.add(row.messageSenderId)
                  if (!ChatAuthorId)
                    ChatAuthorId = row.ChatAuthorId
                  if (row.messageId)
                  messages.push({
                    id: row.messageId,
                    userId: row.messageSenderId,
                    chatId: row.chatId,
                    date: row.date,
                    content: row.content
                  } as MessageDto)
                }
                resolve({
                  id,
                  userId: ChatAuthorId,
                  recipients: Array.from(recipients), 
                  messages:  Array.from(messages)
                } as ChatDto)
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

  
  async getChatsAndMessagesRelatedToUser(userId: string): Promise<MessageDto[]> {
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
                  return ({
                    ...r
                  }) as MessageDto;

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