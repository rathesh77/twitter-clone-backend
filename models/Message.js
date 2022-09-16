class Message {

  static async create(driver, message) {
    const session = driver.session({ database: "neo4j" });

    try {
      const tx = session.beginTransaction();
      const getAuthorQuery = `MATCH (u: User) WHERE u.email = $email RETURN ID(u) AS uid LIMIT 1`;
      const author = await tx.run(getAuthorQuery, { email: "toto@toto.fr" });
      const authorId = author.records[0].get("uid");
      const getTweetQuery = `
                            MATCH 
                              (t: Tweet) 
                            WHERE t.authorId = $authorId
                            RETURN t.uid AS uid
                            LIMIT 1`;

      const tweet = await tx.run(getTweetQuery, { authorId });
      const tweetId = tweet.records[0].get("uid");
      const writeQuery = `CREATE (message:Message {
                            uid: $uid,
                            content: $content,
                            authorId: $authorId,
                            tweetId: $tweetId})
                            return message, message.uid AS uid
                        `;
      const createdMessage = await tx.run(writeQuery, {
        ...message,
        tweetId,
        authorId,
      });
      await tx.commit();
      return createdMessage.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }
}

module.exports = Message