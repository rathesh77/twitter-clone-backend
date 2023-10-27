import { RunResult } from 'sqlite3';
import sqliteDatabase from '../../database/sqlite.database';
import MessageInterface from '../../interface/message.interface';
import MessageRequest from '../../models/request/message.request';

class MessageSqlite implements MessageInterface{
  async create(message: MessageRequest): Promise<RunResult> {
    const {content, userId, chatId } = message;
    return await (await sqliteDatabase.createEntity('Message', ['content', 'userId', 'chatId', 'date'], [content, userId, chatId, Date.now()]));
  }

}

export default MessageSqlite;