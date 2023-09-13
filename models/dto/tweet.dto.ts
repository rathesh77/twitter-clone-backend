import UserDto from "./user.dto"

type Tweet = {
  content: string,
  date: number
  dislikes?: number
  likes?: number
  mentionnedPeople?: Partial<UserDto>[]
  replies?: number
  retweets?: number
  shares?: number
  uid?: string,
  userId?: string
}

class TweetDto {

  uid?;
  content;
  date;
  dislikes?;
  likes?;
  mentionnedPeople?;
  replies?;
  retweets?;
  shares?;
  userId?;

  constructor(data: Tweet) {
    this.content = data.content;
    this.date = data.date;
    this.dislikes = data.dislikes;
    this.likes = data.likes;
    this.mentionnedPeople = data.mentionnedPeople;
    this.replies = data.replies;
    this.retweets = data.retweets;
    this.shares = data.shares;
    this.uid = data.uid;
    this.userId = data.userId;

  }

}

export default TweetDto