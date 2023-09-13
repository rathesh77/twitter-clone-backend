import { RunResult } from "sqlite3";
import UserTweetDto from "../models/dto/userTweet.dto";

export default interface UserTweetInterface {

  userWroteTweet(userId: string, tweetId: string): Promise<UserTweetDto>;
}