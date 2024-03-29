import { uuid } from 'uuidv4';
import bcrypt from 'bcrypt';
import neo4jDatabase from '../../database/neo4j.database';
import UserInterface from '../../interface/user.interface';
import UserDto from '../../models/dto/user.dto';
import UserTweetDto from '../../models/dto/userTweet.dto';
const saltRounds = 10;

class UserNeo4j implements UserInterface{

  
  async create(user: UserDto): Promise<UserDto | null> {
    
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });
    const uid = uuid();
    const hashedPassword = await bcrypt.hash(user.password!, saltRounds);
    try {
      const writeQuery = `CREATE (u:User {
                                username: $username, 
                                email: $email,
                                password: $hashedPassword,
                               uid: $uid,
                               avatar: $avatar,
                               banner: $banner
                              })
                              RETURN u, u.uid AS uid
                            `;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const writeResult:any = await session.writeTransaction((tx) =>
        tx.run(writeQuery, { ...user, hashedPassword, uid })
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      writeResult.records.forEach((record:any) => {
        const user = record.get('uid');
        console.info(`Created user: ${JSON.stringify(user)}`);
      });
      delete writeResult.records[0].password;
      return writeResult.records[0].get('u').properties;
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  
  async findByUserId(userId: string): Promise<UserDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });

    try {
      const tx = session.beginTransaction();
      const getAuthorQuery = 'MATCH (u: User) WHERE u.uid = $userId RETURN u, u.uid AS uid LIMIT 1';
      const author = await tx.run(getAuthorQuery, { userId });

      if (author.records.length === 0)
        throw 'l\'auteur n\'existe pas';

      await tx.commit();

      return {...author.records[0].get('u').properties, password: null} as UserDto;
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;

  }
  async findByEmailAndPassword(email: string, password: string): Promise<UserDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });
    try {
      const tx = session.beginTransaction();
      const getUserQuery = 'MATCH (u: User {email: $email}) RETURN u';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let user: any = await tx.run(getUserQuery, { email });
      if (user.records.length === 0)
        return null;
      user = user.records[0];
      if (!await bcrypt.compare(password, user._fields[0].properties.password)) {
        return null;
      }
      await tx.commit();
      return {...user.get('u').properties, password: null};
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async findByEmail(email: string): Promise<UserDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });
    try {
      const tx = session.beginTransaction();
      const getUserQuery = 'MATCH (u: User {email: $email}) RETURN u';
      const user = await tx.run(getUserQuery, { email });
      if (user.records.length === 0) {
        return null;
      }

      await tx.commit();

      return {...user.records[0].get('u').properties, password: null};
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async findAuthoredTweet(tweetId: number): Promise<UserTweetDto | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });
    try {
      const tx = session.beginTransaction();
      const getUserWhoAuthoredTweet = 'MATCH (u: User)-[:WROTE_TWEET]->(t: Tweet {uid: $tweetId}) RETURN u,t ';
      const user = await tx.run(getUserWhoAuthoredTweet, { tweetId });
      if (user.records.length === 0) {
        return null;
      }
      await tx.commit();
      return {
        user: {...user.records[0].get('u').properties, password: null},
        relation: 'WROTE_TWEET',
        tweet: user.records[0].get('t').properties
      };
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async findResults(search: string): Promise<UserDto[] | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });
    try {
      const tx = session.beginTransaction();
      const getResultsQuery = 'MATCH (u: User) where u.username =~ \'(?i)\'+$search+\'.*\' return u';
      const results = await tx.run(getResultsQuery, { search });

      await tx.commit();
      return results.records.map((r) => {
        return {...r.get('u').properties, password: null} as UserDto;
      });
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async doesUserFollowRecipient(userId: string, recipientId: string): Promise<boolean | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });
    try {
      const tx = session.beginTransaction();
      const query = 'MATCH (u: User {uid: $userId})-[:KNOWS]->(r: User {uid: $recipientId}) RETURN u, r LIMIT 1';
      const results = await tx.run(query, { userId, recipientId });
      if (results.records.length === 0) {
        return false;
      }
      await tx.commit();
      return true;
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async getSuggestionsForUser(userId: string): Promise<UserDto[]| null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });
    try {
      const tx = session.beginTransaction();
      const query = `
                    MATCH (u: User {uid: $userId})-[:KNOWS]->(r: User)-[:KNOWS]->(world) 
                    WHERE NOT (u)-[:KNOWS]->(world)
                    AND u.uid <> world.uid
                    RETURN DISTINCT u, world LIMIT 1
                    `;
      const results = await tx.run(query, { userId });
    
      await tx.commit();
      return results.records.map((r) => {
        return ({...r.get('world').properties, password: null});
      });
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async getFollowersCount(userId: string): Promise<number | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });
    try {
      const tx = session.beginTransaction();
      const query = `
                    MATCH (u: User {uid: $userId})<-[:KNOWS]-(r: User)
                    return count (*) as count
                    `;
      const results = await tx.run(query, { userId });
    
      await tx.commit();
      return results.records[0].get('count').toInt();
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
  async getFollowingsCount(userId: string): Promise<number | null> {
    const session = neo4jDatabase!.driver!.session({ database: 'neo4j' });
    try {
      const tx = session.beginTransaction();
      const query = `
                    MATCH (u: User {uid: $userId})-[:KNOWS]->(r: User)
                    return count (*) as count
                    `;
      const results = await tx.run(query, { userId });
    
      await tx.commit();
      return results.records[0].get('count').toInt();
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
    return null;
  }
}

export default UserNeo4j;