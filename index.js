const dotenv = require("dotenv");
const cors = require("cors");
const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const fs = require('fs');

const Neo4jDB = require('./database/Neo4jDB');
const tweetRoutes = require('./routes/tweet.routes')
const userRoutes = require('./routes/user.routes')

const initData = require('./initData');
const Chat = require("./models/Chat");
const app = express();
const sessionMiddleware = session({
  secret: 'toto',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
  }
});

require('./database/config')

app.use(express.static('uploads'))
app.use(bodyParser.json());
app.use(cors({
  credentials: true,
  origin: ['http://localhost:3000', 'http://192.168.0.21:3000']
}));
app.use(sessionMiddleware)
app.use('/', userRoutes)
app.use('/', tweetRoutes)

const server = require('http').createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));
io.use((socket, next) => {
  const session = socket.request.session;
  console.log(session)
  if (session && session.userId) {
    next();
  } else {
    next(new Error("unauthorized"));
  }
});

dotenv.config();

(async ()=>{

  Neo4jDB.connect()
  if (process.argv.includes('initData')) {
    fs.readdir('uploads', function(err, files){
      files.forEach(f => fs.rmSync('uploads/'+f))
    })
    initData(Neo4jDB)
  }


  io.on('connection', (socket) => {
    console.log('a user connected');
    socket.emit('message')

    socket.on('get_chats', (data)=> {
      console.log('data:', data)
      //Chat.create(data)
    })

    socket.on('create_chat', (data)=> {
      Chat.create(data)
    })

  });



  
  server.listen(8080, null, function () {
    console.log("app is listening on port 8080");
  });
  
  server.on('close',(async (err) => {
    db.close();
    console.log("server closed");
    await Neo4jDB.close();
    process.exit(err ? 1 : 0);
  }));
}) ()