import UserInterface from '../../interface/user.interface';

class UserDao implements UserInterface {
  implementation: UserInterface

  constructor(implementation: UserInterface) {
    this.implementation = implementation
  }
  async findByUserId(userId: number): Promise<any> {
    return await this.implementation.findByUserId(userId)
  }
  async findByEmailAndPassword(email: string, password: string): Promise<any> {
    return await this.implementation.findByEmailAndPassword(email, password)
  }
  async findByEmail(email: string): Promise<any> {
    return await this.implementation.findByEmail(email)
  }
  async findAuthoredTweet(tweetId: number): Promise<any> {
    return await this.implementation.findAuthoredTweet(tweetId)
  }
  async findResults(search: string): Promise<any[] | null> {
    return await this.implementation.findResults(search)
  }
  async doesUserFollowRecipient(userId: number, recipientId: number): Promise<any> {
    return await this.implementation.doesUserFollowRecipient(userId, recipientId)
  }
  async getSuggestionsForUser(userId: number): Promise<UserDto[] | null> {
    return await this.implementation.getSuggestionsForUser(userId)
  }
  async getFollowers(userId: number): Promise<UserDto[] | null> {
    return await this.implementation.getFollowers(userId)
  }
  async getFollowings(userId: number): Promise<UserDto[] | null> {
    return await this.implementation.getFollowings(userId)
  }
  async create(user: UserDto) {
    return await this.implementation.create(user)
  }

}

export default UserDao