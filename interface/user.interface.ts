import { RunResult } from "sqlite3";

export default interface UserInterface {
  create(user: UserDto): Promise<any>
  findByUserId(userId: string): Promise<any>,
  findByEmailAndPassword(email: string, password: string): Promise<any>,
  findByEmail(email: string): Promise<any>,
  findAuthoredTweet(tweetId: number): Promise<any>,
  findResults(search: string): Promise<any[] | null>,
  doesUserFollowRecipient(userId: string, recipientId: number): Promise<boolean | any | null>,
  getSuggestionsForUser(userId: string): Promise<any[] | null>,
  getFollowers(userId: string): Promise<any[] | null>,
  getFollowings(userId: string): Promise<any[] | null>
}