import { RunResult } from "sqlite3";

export default interface ChatInterface {

  create(ChatDto: ChatDto): Promise<RunResult>;
  getChatsAndMessagesRelatedToUser(userId: number):  Promise<ChatMessageDto[]>;
}