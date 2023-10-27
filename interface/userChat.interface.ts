import { RunResult } from 'sqlite3';
import UserChatDto from '../models/dto/userChat.dto';

interface UserChatInterface {

  create(userChat: UserChatDto): Promise<RunResult>;
}

export default UserChatInterface;