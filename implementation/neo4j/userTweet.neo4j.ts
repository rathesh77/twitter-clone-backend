import { uuid } from 'uuidv4';

import neo4jDatabase from "../../database/neo4j.database";
import UserTweetInterface from '../../interface/userTweet.interface';
import UserTweetDto from '../../models/dto/userTweet.dto';

class UserTweetNeo4j implements UserTweetInterface {
  async userWroteTweet(userId: string, tweetId: string): Promise<UserTweetDto> {

    const node = {
      leftNode: { label: "User", uid: userId },
      rightNode: { label: "Tweet", uid: tweetId },
      relation: "WROTE_TWEET"
    }
    await neo4jDatabase!.createRelationship(node);

    return new UserTweetDto({ userId, tweetId })
  }

}

export default UserTweetNeo4j