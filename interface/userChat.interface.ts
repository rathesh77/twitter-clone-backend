import { RunResult } from "sqlite3";
import UserChatDto from "../models/dto/userChat.dto";

export default interface UserChatInterface {

  create(userChat: UserChatDto): Promise<RunResult>;
}