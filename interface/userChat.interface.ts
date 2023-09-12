import { RunResult } from "sqlite3";

export default interface UserChatInterface {

  create(userChat: UserChatDto): Promise<RunResult>;
}