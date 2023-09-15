import TweetInterface from '../../interface/tweet.interface';
import TweetDto from '../dto/tweet.dto';

class TweetDao implements TweetInterface {

  implementation: TweetInterface

  constructor(implementation: TweetInterface) {
    this.implementation = implementation
  }

  async create(tweet: TweetDto): Promise<TweetDto | null> {
    return await this.implementation.create(tweet)
  }
  async findAllTweetsUserInteractedWith(userId: string): Promise<any> {
    return await this.implementation.findAllTweetsUserInteractedWith(userId)
  }
  async findAllRelatedTweetsToUser(userId: string): Promise<TweetDto[] | null> {
    return await this.implementation.findAllRelatedTweetsToUser(userId)
  }
  async findById(uid: string): Promise<any> {
    return await this.implementation.findById(uid)
  }
  async findInnerTweetsByTweetId(uid: string): Promise<any> {
    return await this.implementation.findInnerTweetsByTweetId(uid)
  }
  async increaseRepliesCount(uid: string): Promise<any> {
    return await this.implementation.increaseRepliesCount(uid)
  }
  async findLimit1(): Promise<any> {
    return await this.implementation.findLimit1()
  }
  async retweet(uid: string): Promise<any> {
    return await this.implementation.retweet(uid)
  }
  async cancelRetweet(uid: string): Promise<any> {
    return await this.implementation.cancelRetweet(uid)
  }
  async findUserThatRetweeted(uid: string, userId: string): Promise<any> {
    return await this.implementation.findUserThatRetweeted(uid, userId)
  }
  async findUserThatLiked(uid: string, userId: string): Promise<any> {
    return await this.implementation.findUserThatLiked(uid, userId)
  }
  async findUserThatDisliked(uid: string, userId: string): Promise<any> {
    return await this.implementation.findUserThatDisliked(uid, userId)
  }
  async likeTweet(uid: string): Promise<any> {
    return await this.implementation.likeTweet(uid)
  }
  async cancelTweetLike(uid: string): Promise<any> {
    return await this.implementation.cancelTweetLike(uid)
  }
  async dislikeTweet(uid: string): Promise<any> {
    return await this.implementation.dislikeTweet(uid)
  }
  async cancelTweetDislike(uid: string): Promise<any> {
    return await this.implementation.cancelTweetDislike(uid)
  }

}

export default TweetDao