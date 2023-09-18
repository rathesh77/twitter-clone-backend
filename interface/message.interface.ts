import { RunResult } from "sqlite3";
import MessageDto from "../models/dto/message.dto";
import MessageRequest from "../models/request/message.request";

export default interface MessageInterface {

  create(message: MessageRequest): Promise<RunResult>;
}