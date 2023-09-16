import TweetDto from "./tweet.dto"
import UserDto from "./user.dto"

interface UserTweetDto {
  relation: string,
  user: UserDto, 
  tweet: TweetDto
}

export default UserTweetDto