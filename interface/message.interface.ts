import { RunResult } from "sqlite3";

export default interface MessageInterface {

  create(message: MessageDto): Promise<RunResult>;
}