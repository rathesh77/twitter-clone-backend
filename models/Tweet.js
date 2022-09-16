class Tweet {

  static async create(driver, tweet) {
    const session = driver.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getAuthorQuery = `MATCH (u: User) WHERE u.email = $email RETURN ID(u) AS uid LIMIT 1`;
      const author = await tx.run(getAuthorQuery, { email: "toto@toto.fr" });
      const authorId = author.records[0].get("uid");
      const postTweetQuery = `
      CREATE (t:Tweet {
                             uid: $uid,
                              authorId: $authorId,
                              content: $content,  
                              likes: $likes, 
                              dislikes: $dislikes, 
                              shares: $shares, 
                              mentionnedPeople: $mentionnedPeople
                            })
                            return t, t.uid AS uid
                          `;
      const createdTweet = await tx.run(postTweetQuery, { ...tweet, authorId });
      console.info(`Created tweet: ${JSON.stringify(createdTweet.records[0])}`);
      await tx.commit();

      return createdTweet.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }

}

module.exports = Tweet