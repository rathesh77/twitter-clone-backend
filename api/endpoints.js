const router = require('express').Router()

router.post("/tweet", async function (req, res) {
  const requestData = req.body.data;
  if (
    requestData.authorId == null ||
    requestData.content == null ||
    requestData.mentionnedPeople == null
  ) {
    res.status(400);
    res.json({ msg: "error" });
    return;
  }

  const tweet = {
    ...requestData,
    likes: 0,
    dislikes: 0,
    shares: 0,
    uid: 59,
  };
  await createTweet(driver, tweet);
  await createRelationship(
    { label: "User", uid: 1 },
    { label: "Tweet", uid: 59 },
    "WROTE_TWEET"
  );
  res.status(200);
  res.json(tweet);
});

module.exports = router