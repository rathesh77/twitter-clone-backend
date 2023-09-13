import TweetInterface from '../../interface/tweet.interface';

class TweetDao implements TweetInterface {

  implementation: TweetInterface

  constructor(implementation: TweetInterface) {
    this.implementation = implementation
  }

  async create(tweet: TweetDto): Promise<any> {
    return await this.implementation.create(tweet)
  }
  async findAllTweetsUserInteractedWith(userId: string): Promise<any> {
    return await this.implementation.findAllTweetsUserInteractedWith(userId)
  }
  async findAllRelatedTweetsToUser(userId: string): Promise<any> {
    return await this.implementation.findAllRelatedTweetsToUser(userId)
  }
  async findById(id: string): Promise<any> {
    return await this.implementation.findById(id)
  }
  async findInnerTweetsByTweetId(id: string): Promise<any> {
    return await this.implementation.findInnerTweetsByTweetId(id)
  }
  async increaseRepliesCount(id: number): Promise<any> {
    return await this.implementation.increaseRepliesCount(id)
  }
  async findLimit1(): Promise<any> {
    return await this.implementation.findLimit1()
  }
  async retweet(id: number): Promise<any> {
    return await this.implementation.retweet(id)
  }
  async cancelRetweet(id: number): Promise<any> {
    return await this.implementation.cancelRetweet(id)
  }
  async findUserThatRetweeted(id: number, userId: string): Promise<any> {
    return await this.implementation.findUserThatRetweeted(id, userId)
  }
  async findUserThatLiked(id: number, userId: string): Promise<any> {
    return await this.implementation.findUserThatLiked(id, userId)
  }
  async findUserThatDisliked(id: number, userId: string): Promise<any> {
    return await this.implementation.findUserThatDisliked(id, userId)
  }
  async likeTweet(id: number): Promise<any> {
    return await this.implementation.likeTweet(id)
  }
  async cancelTweetLike(id: number): Promise<any> {
    return await this.implementation.cancelTweetLike(id)
  }
  async dislikeTweet(id: number): Promise<any> {
    return await this.implementation.dislikeTweet(id)
  }
  async cancelTweetDislike(id: number): Promise<any> {
    return await this.implementation.cancelTweetDislike(id)
  }

}

export default TweetDao