const dotenv = require("dotenv");
const cors = require("cors");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const endpoints = require('./api/endpoints')
const initData = require('./initData')
const Neo4j = require('./database/Neo4j');

app.use(bodyParser.json());
app.use(cors());
app.use('/', endpoints)

dotenv.config();

(async ()=>{
  const uri = process.env["NEO4J_URI"];
  const user = process.env["NEO4J_USER"];
  const password = process.env["NEO4J_PWD"];
  const db = new Neo4j({uri, user, password})
  db.connect()
  await initData(db)

  const server = app.listen(8080, null, function () {
    console.log("app is listening on port 8080");
  });
  
  server.on('close',(async (err) => {
    console.log("server closed");
    await db.close();
    process.exit(err ? 1 : 0);
  }));
}) ()