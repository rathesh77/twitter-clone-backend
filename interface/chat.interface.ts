import { RunResult } from "sqlite3";

export default interface ChatInterface {

  create(chatDto: ChatDto, messageContent?: string): Promise<RunResult>;
  getChatsAndMessagesRelatedToUser(userId: string):  Promise<any[]>;
}