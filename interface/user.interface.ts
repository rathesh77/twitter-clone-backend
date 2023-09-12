import { RunResult } from "sqlite3";

export default interface UserInterface {
  create(user: UserDto): Promise<any>
  findByUserId(userId: number): Promise<any>,
  findByEmailAndPassword(email: string, password: string): Promise<any>,
  findByEmail(email: string): Promise<any>,
  findAuthoredTweet(tweetId: number): Promise<any>,
  findResults(search: string): Promise<any[] | null>,
  doesUserFollowRecipient(userId: number, recipientId: number): Promise<boolean | any | null>,
  getSuggestionsForUser(userId: number): Promise<UserDto[] | null>,
  getFollowers(userId: number): Promise<UserDto[] | null>,
  getFollowings(userId: number): Promise<UserDto[] | null>
}