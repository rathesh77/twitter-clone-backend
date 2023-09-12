export default interface TweetInterface {

  create(tweet: TweetDto): Promise<any>;
  findAllTweetsUserInteractedWith(userId: number): Promise<any>;
  findAllRelatedTweetsToUser(userId: number): Promise<any>;
  findById(id: number): Promise<any>;
  findInnerTweetsByTweetId(id: number): Promise<any>;
  increaseRepliesCount(id: number): Promise<any>;
  findLimit1(): Promise<any>;
  retweet(id: number): Promise<any>;
  cancelRetweet(id: number): Promise<any>;
  findUserThatRetweeted(id: number, userId: number): Promise<any>;
  findUserThatLiked(id: number, userId: number): Promise<any>;
  findUserThatDisliked(id: number, userId: number): Promise<any>;
  likeTweet(id: number): Promise<any>;
  cancelTweetLike(id: number): Promise<any>;
  dislikeTweet(id: number): Promise<any>;
  cancelTweetDislike(id: number): Promise<any>;
}