import TweetDto from '../models/dto/tweet.dto';
import UserTweetDto from '../models/dto/userTweet.dto';

interface TweetInterface {

  create(tweet: TweetDto): Promise<UserTweetDto | null>;
  findAllTweetsUserInteractedWith(userId: string): Promise<UserTweetDto[] | null>;
  findAllRelatedTweetsToUser(userId: string): Promise<UserTweetDto[] | null>;
  findById(uid: string): Promise<UserTweetDto | null>;
  findInnerTweetsByTweetId(uid: string): Promise<UserTweetDto[] | null>;
  increaseRepliesCount(uid: string): Promise<TweetDto | null>;
  retweet(uid: string): Promise<TweetDto | null>;
  cancelRetweet(uid: string): Promise<TweetDto | null>;
  findUserThatRetweeted(uid: string, userId: string): Promise<UserTweetDto | null>;
  findUserThatLiked(uid: string, userId: string): Promise<UserTweetDto | null>;
  findUserThatDisliked(uid: string, userId: string): Promise<UserTweetDto | null>;
  likeTweet(uid: string): Promise<TweetDto | null>;
  cancelTweetLike(uid: string): Promise<TweetDto | null>;
  dislikeTweet(uid: string): Promise<TweetDto | null>;
  cancelTweetDislike(uid: string): Promise<TweetDto | null>;
}

export default TweetInterface;