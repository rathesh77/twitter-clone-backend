import { RunResult } from "sqlite3";
import sqliteDatabase from "../../database/sqlite.database";
import UserChatInterface from "../../interface/userChat.interface";
import UserChatDto from "../../models/dto/userChat.dto";

class UserchatSqlite implements UserChatInterface{
  async create(userChat: UserChatDto): Promise<RunResult> {
    return (await sqliteDatabase.createEntity('UserChat', ["chatId", "userId"], [userChat['chatId'], userChat['userId']]))
  }

}

export default UserchatSqlite