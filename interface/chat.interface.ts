import { RunResult } from "sqlite3";
import MessageDto from "../models/dto/message.dto";
import ChatRequest from "../models/request/chat.request";
import ChatDto from "../models/dto/chat.dto";

export default interface ChatInterface {

  create(chatDto: ChatRequest, messageContent?: string): Promise<RunResult>;
  getChatsAndMessagesRelatedToUser(userId: string):  Promise<MessageDto[]>;
  findById(id: number): Promise<ChatDto>;

}