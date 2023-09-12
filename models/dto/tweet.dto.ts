type Tweet = {
  id: number
  content: string,
  date: BigInt
  dislikes: number
  likes: number
  mentionnedPeople?: Partial<UserDto>[]
  replies: number
  retweets: number
  shares: number
  uid: string,
  authorId: number
}

class TweetDto {

  id;
  content;
  date;
  dislikes;
  likes;
  mentionnedPeople;
  replies;
  retweets;
  shares;
  uid;
  authorId;

  constructor(data: Tweet) {
    this.id = data.id;
    this.content = data.id;
    this.date = data.id;
    this.dislikes = data.id;
    this.likes = data.likes;
    this.mentionnedPeople = data.id;
    this.replies = data.replies;
    this.retweets = data.retweets;
    this.shares = data.shares;
    this.uid = data.uid;
    this.authorId = data.authorId;

  }

}

module.exports = TweetDto