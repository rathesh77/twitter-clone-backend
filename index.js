const dotenv = require("dotenv");
const cors = require("cors");
const express = require("express");
const session = require('express-session');
const app = express();
const bodyParser = require("body-parser");

const tweetRoutes = require('./routes/tweet.routes')
const userRoutes = require('./routes/user.routes')

const initData = require('./initData')
const Neo4jDB = require('./database/Neo4jDB');
require('./database/config')

app.use(bodyParser.json());
app.use(cors({
  credentials: true,
  origin: ['http://localhost:3000']
}));
app.use(session({
  secret: 'toto',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
  }
}
))
app.use('/', userRoutes)
app.use('/', tweetRoutes)


dotenv.config();

(async ()=>{

  Neo4jDB.connect()
  if (process.argv.includes('initData'))
    await initData(Neo4jDB)

  const server = app.listen(8080, null, function () {
    console.log("app is listening on port 8080");
  });
  
  server.on('close',(async (err) => {
    console.log("server closed");
    await Neo4jDB.close();
    process.exit(err ? 1 : 0);
  }));
}) ()