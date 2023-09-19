import { RunResult } from 'sqlite3';
import MessageRequest from '../models/request/message.request';

interface MessageInterface {

  create(message: MessageRequest): Promise<RunResult>;
}

export default MessageInterface;