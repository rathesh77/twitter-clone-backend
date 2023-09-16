import UserDto from "../models/dto/user.dto";

export default interface UserInterface {
  create(user: UserDto): Promise<UserDto | null>
  findByUserId(userId: string): Promise<UserDto | null>,
  findByEmailAndPassword(email: string, password: string): Promise<UserDto | null>,
  findByEmail(email: string): Promise<any>,
  findAuthoredTweet(tweetId: number): Promise<any>,
  findResults(search: string): Promise<any[] | null>,
  doesUserFollowRecipient(userId: string, recipientId: string): Promise<boolean | any | null>,
  getSuggestionsForUser(userId: string): Promise<any[] | null>,
  getFollowers(userId: string): Promise<any[] | null>,
  getFollowings(userId: string): Promise<any[] | null>
}