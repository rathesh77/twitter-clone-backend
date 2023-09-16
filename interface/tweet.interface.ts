import TweetDto from "../models/dto/tweet.dto";
import UserTweetDto from "../models/dto/userTweet.dto";

export default interface TweetInterface {

  create(tweet: TweetDto): Promise<UserTweetDto | null>;
  findAllTweetsUserInteractedWith(userId: string): Promise<UserTweetDto[] | null>;
  findAllRelatedTweetsToUser(userId: string): Promise<UserTweetDto[] | null>;
  findById(uid: string): Promise<any>;
  findInnerTweetsByTweetId(uid: string): Promise<any>;
  increaseRepliesCount(uid: string): Promise<any>;
  findLimit1(): Promise<any>;
  retweet(uid: string): Promise<any>;
  cancelRetweet(uid: string): Promise<any>;
  findUserThatRetweeted(uid: string, userId: string): Promise<any>;
  findUserThatLiked(uid: string, userId: string): Promise<any>;
  findUserThatDisliked(uid: string, userId: string): Promise<any>;
  likeTweet(uid: string): Promise<any>;
  cancelTweetLike(uid: string): Promise<any>;
  dislikeTweet(uid: string): Promise<any>;
  cancelTweetDislike(uid: string): Promise<any>;
}