import { RunResult } from "sqlite3";

export default interface MessageInterface {

  create(tweet: TweetDto): Promise<any>;
}