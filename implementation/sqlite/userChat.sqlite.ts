import { RunResult } from "sqlite3";
import sqliteDatabase from "../../database/sqlite.database";
import UserChatInterface from "../../interface/userChat.interface";

class UserchatSqlite implements UserChatInterface{
  async create(userChat: UserChat): Promise<RunResult> {
    return (await sqliteDatabase.createEntity('UserChat', ["chatId", "userId"], [...Object.values(userChat)]))
  }

}

export default UserchatSqlite