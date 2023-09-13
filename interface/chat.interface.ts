import { RunResult } from "sqlite3";
import ChatDto from "../models/dto/chat.dto";

export default interface ChatInterface {

  create(chatDto: ChatDto, messageContent?: string): Promise<RunResult>;
  getChatsAndMessagesRelatedToUser(userId: string):  Promise<any[]>;
}