import { RunResult } from "sqlite3";
import sqliteDatabase from "../../database/sqlite.database";
import UserChatInterface from "../../interface/userChat.interface";

class MessageSqlite implements UserChatInterface{
  async create(message: MessageDto): Promise<RunResult> {
    //return (await sqliteDatabase.createEntity('message', ["chatId", "userId"], [...Object.values(userChat)]))
    return await (await sqliteDatabase.createEntity('Message', ["content", "userId", "chatId", "date"], [...Object.values(message), "strftime('%s', 'now') * 1000)"]))
  }

}

export default MessageSqlite