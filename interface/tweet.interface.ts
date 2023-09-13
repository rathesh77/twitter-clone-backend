import TweetDto from "../models/dto/tweet.dto";

export default interface TweetInterface {

  create(tweet: TweetDto): Promise<TweetDto | null>;
  findAllTweetsUserInteractedWith(userId: string): Promise<any>;
  findAllRelatedTweetsToUser(userId: string): Promise<TweetDto[] | null>;
  findById(id: string): Promise<any>;
  findInnerTweetsByTweetId(id: string): Promise<any>;
  increaseRepliesCount(id: number): Promise<any>;
  findLimit1(): Promise<any>;
  retweet(id: number): Promise<any>;
  cancelRetweet(id: number): Promise<any>;
  findUserThatRetweeted(id: number, userId: string): Promise<any>;
  findUserThatLiked(id: number, userId: string): Promise<any>;
  findUserThatDisliked(id: number, userId: string): Promise<any>;
  likeTweet(id: number): Promise<any>;
  cancelTweetLike(id: number): Promise<any>;
  dislikeTweet(id: number): Promise<any>;
  cancelTweetDislike(id: number): Promise<any>;
}