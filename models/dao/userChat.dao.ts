import UserChatInterface from '../../interface/userChat.interface';

class UserChatDao {

  static userChatImplementation: UserChatInterface;

  constructor(userChatImplementation: UserChatInterface   /*passer un UserchatSqlite ici */) {
    userChatImplementation = userChatImplementation

  }
    static async create(data: UserChatDto) {
     return await UserChatDao.userChatImplementation.create(data)
    }
}

export default UserChatDao