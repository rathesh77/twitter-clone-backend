import { RunResult } from 'sqlite3'
import SQLiteDB from '../../database/sqlite.database'
import ChatInterface from '../../interface/chat.interface';
import UserChatInterface from '../../interface/userChat.interface';

class ChatDao implements ChatInterface{

  chatImplementation: ChatInterface;

  constructor(chatImplementation: ChatInterface,   /*passer un chatSqlite ici */) {
    this.chatImplementation = chatImplementation

  }
  async create(data: ChatDto): Promise<RunResult> {
    return await new Promise(async (resolve, reject) => {
      try {
        let runResult: RunResult
        runResult = await this.chatImplementation.create(data)
        return runResult
        /*const chatId = runResult.lastID
        runResult = await UserChatDao.create({ chatId, userId: authorId })
        for (const recipient of recipients) {
          const recipientId = recipient.uid
          runResult = await UserChatDao.create({ chatId, userId: +recipientId })

        }
        runResult = await (await SQLiteDB.createEntity('Message', ["content", "userId", "chatId", "date"], [content, authorId, chatId, "strftime('%s', 'now') * 1000)"]))
      */} catch (error) {
        console.error(`Something went wrong: ${error}`);
      } finally {
      }
    })
  }

  async getChatsAndMessagesRelatedToUser(userId: number): Promise<ChatMessageDto[]> {
    return await this.chatImplementation.getChatsAndMessagesRelatedToUser(userId)

  }
}

export default ChatDao