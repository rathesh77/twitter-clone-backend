import { RunResult } from "sqlite3";
import MessageDto from "../models/dto/message.dto";

export default interface MessageInterface {

  create(message: MessageDto): Promise<RunResult>;
}