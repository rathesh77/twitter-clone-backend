import UserDto from './user.dto';

interface TweetDto {
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

export default TweetDto;