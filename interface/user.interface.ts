import UserDto from "../models/dto/user.dto";
import UserTweetDto from "../models/dto/userTweet.dto";

export default interface UserInterface {
  create(user: UserDto): Promise<UserDto | null>
  findByUserId(userId: string): Promise<UserDto | null>,
  findByEmailAndPassword(email: string, password: string): Promise<UserDto | null>,
  findByEmail(email: string): Promise<UserDto | null>,
  findAuthoredTweet(tweetId: number): Promise<UserTweetDto | null>,
  findResults(search: string): Promise<UserDto[] | null>,
  doesUserFollowRecipient(userId: string, recipientId: string): Promise<boolean | null>,
  getSuggestionsForUser(userId: string): Promise<UserDto[] | null>,
  getFollowersCount(userId: string): Promise<number | null>,
  getFollowingsCount(userId: string): Promise<number | null>
}