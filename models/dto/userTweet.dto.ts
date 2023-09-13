type UserTweet = {
  id?: number,
  userId: string, 
  tweetId: string
}

class UserTweetDto {
  id;
  userId;
  tweetId;

  constructor(data: UserTweet) {
    this.id = data.id
    this.userId = data.userId
    this.tweetId = data.tweetId
  }

}

export default UserTweetDto