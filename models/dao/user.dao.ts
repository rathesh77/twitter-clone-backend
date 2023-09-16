import UserInterface from '../../interface/user.interface';
import UserDto from '../dto/user.dto';
import UserTweetDto from '../dto/userTweet.dto';

class UserDao implements UserInterface {
  implementation: UserInterface

  constructor(implementation: UserInterface) {
    this.implementation = implementation
  }
  async findByUserId(userId: string): Promise<UserDto | null> {
    return await this.implementation.findByUserId(userId)
  }
  async findByEmailAndPassword(email: string, password: string): Promise<UserDto | null> {
    return await this.implementation.findByEmailAndPassword(email, password)
  }
  async findByEmail(email: string): Promise<UserDto | null> {
    return await this.implementation.findByEmail(email)
  }
  async findAuthoredTweet(tweetId: number): Promise<UserTweetDto | null> {
    return await this.implementation.findAuthoredTweet(tweetId)
  }
  async findResults(search: string): Promise<UserDto[] | null> {
    return await this.implementation.findResults(search)
  }
  async doesUserFollowRecipient(userId: string, recipientId: string): Promise<boolean | null> {
    return await this.implementation.doesUserFollowRecipient(userId, recipientId)
  }
  async getSuggestionsForUser(userId: string): Promise<UserDto[] | null> {
    return await this.implementation.getSuggestionsForUser(userId)
  }
  async getFollowersCount(userId: string): Promise<number | null> {
    return await this.implementation.getFollowersCount(userId)
  }
  async getFollowingsCount(userId: string): Promise<number | null> {
    return await this.implementation.getFollowingsCount(userId)
  }
  async create(user: UserDto): Promise<UserDto | null> {
    return await this.implementation.create(user)
  }

}

export default UserDao