import UserChatInterface from '../../interface/userChat.interface';
import UserTweetInterface from '../../interface/userTweet.interface';
import UserTweetDto from '../dto/userTweet.dto';

class UserTweetDao {

  implementation: UserTweetInterface;

  constructor(implementation: UserTweetInterface   /*passer un UserchatSqlite ici */) {
    this.implementation = implementation

  }
  async userWroteTweet(userId: string, tweetId: string): Promise<UserTweetDto> {
    return await this.implementation.userWroteTweet(userId, tweetId)
  }

}

export default UserTweetDao