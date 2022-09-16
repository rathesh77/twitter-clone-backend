class User {

  static async create(driver, user) {
    const session = driver.session({ database: "neo4j" });

    try {
      const writeQuery = `CREATE (u:User {
                                username: $username, 
                                email: $email,
                               uid: $uid
                              })
                              RETURN u, u.uid AS uid
                            `;

      const writeResult = await session.writeTransaction((tx) =>
        tx.run(writeQuery, { ...user })
      );

      writeResult.records.forEach((record) => {
        const user = record.get("uid");
        console.info(`Created user: ${JSON.stringify(user)}`);
      });
      return writeResult.records[0];
    } catch (error) {
      console.error(`Something went wrong: ${error}`);
    } finally {
      await session.close();
    }
  }

}

module.exports = User