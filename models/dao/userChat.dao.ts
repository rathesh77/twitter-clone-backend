import UserChatInterface from '../../interface/userChat.interface';
import UserChatDto from '../dto/userChat.dto';

class UserChatDao {

  implementation: UserChatInterface;

  constructor(implementation: UserChatInterface   /*passer un UserchatSqlite ici */) {
    this.implementation = implementation;

  }
  async create(data: UserChatDto) {
    return await this.implementation.create(data);
  }
}

export default UserChatDao;