import dotenv from "dotenv";
import cors from "cors";
import session from 'express-session'
import bodyParser from "body-parser"
import { Server, Socket } from "socket.io";
import fs from 'fs'
import express from 'express'
import http from 'http'
import Neo4jDB from './database/neo4j.database'
import tweetRoutes from './routes/tweet.routes'
import userRoutes from './routes/user.routes'

import initData from './initData';
import ChatDao from "./models/dao/chat.dao";
import ChatSqlite from "./implementation/sqlite/chat.sqlite";
import neo4jDatabase from "./database/neo4j.database";
import UserDao from "./models/dao/user.dao";
import TweetDao from "./models/dao/tweet.dao";
import TweetNeo4j from "./implementation/neo4j/tweet.neo4j";
import UserNeo4j from "./implementation/neo4j/user.neo4j";
import UserchatSqlite from "./implementation/sqlite/userChat.sqlite";
import MessageSqlite from "./implementation/sqlite/message.sqlite";
import UserTweetDao from "./models/dao/userTweet.dao";

import * as _ from "./types";

const chatDao = new ChatDao(new ChatSqlite, new UserchatSqlite(), new MessageSqlite())

const app = express();
const sessionMiddleware = session({
  secret: 'toto',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
  }
});


app.use(express.static('uploads'))
app.use(bodyParser.json());
app.use(cors({
  credentials: true,
  origin: ['http://localhost:3000', 'http://192.168.0.21:3000']
}));
app.use(sessionMiddleware)
app.use('/', userRoutes)
app.use('/', tweetRoutes)

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});
const wrapper = (middleware: any) => (socket: Socket, next: any) => middleware(socket.request, {}, next);
io.use(wrapper(sessionMiddleware));
io.use((socket, next) => {
  const session = socket.request.session;
  if (session && session.userId) {
    next();
  } else {
    next(new Error("unauthorized"));
  }
});

dotenv.config();

(async () => {

  Neo4jDB!.connect()
  if (process.argv.includes('initData')) {
    fs.readdir('uploads', function (err, files) {
      files.forEach(f => fs.rmSync('uploads/' + f))
    })
    initData(Neo4jDB, new UserDao(new UserNeo4j()), new TweetDao(new TweetNeo4j()))
  }

  io.on('connection', (socket) => {
    console.log('a user connected');
    socket.emit('message')

    socket.on('get_chats', async (data) => {
      //Chat.create(data)
      socket.join(socket.request.session.userId)
      const chats = await chatDao.getChatsAndMessagesRelatedToUser(data.uid)
      const seen: any = {}
      for (const _chat of chats) {
        const { chatId } = _chat
        if (!seen[chatId]) {
          seen[chatId] = true
          if (!socket.rooms.has(`chat/${chatId}`))
            socket.join(`chat/${chatId}`)
        }
      }
      socket.emit('chats_list', chats)
    })

    socket.on('create_chat', async (data) => {
      const userId = data.userId
      const message = data.message
      const createdChat = await chatDao.create(data, message)
      socket.emit('chat_created', createdChat)
      for (const recipient of data.recipients) {
        let cloneRecipients = [...data.recipients]
        cloneRecipients = cloneRecipients.filter((r) => r.uid != recipient.uid)
        cloneRecipients.push(userId)
        socket.to(recipient.uid).emit('user_invited_you', { ...data, ...createdChat, recipients: cloneRecipients })
      }
    })

    socket.on('join', async (chatId) => {
      socket.join(`chat/${chatId}`)
    })

    socket.on('post_message', async (message) => {
      const createdMessageId = await chatDao.create({ recipients: [], userId: '1' }, message)
      socket.emit('posted_message', createdMessageId)
      socket.to(`chat/${message.chatId}`).emit('user_posted_message', { ...message, messageId: createdMessageId, date: Date.now() })
    })

    socket.on('writing', async ({ user, chatId }) => {
      console.log(user, chatId)
      socket.to(`chat/${chatId}`).emit('user_writing', { user, chatId })
    })

  });


  server.listen(8080, function () {
    console.log("app is listening on port 8080");
  });

  server.on('close', (async (err: any) => {
    neo4jDatabase?.close();
    console.log("server closed");
    await neo4jDatabase!.close();
    process.exit(err ? 1 : 0);
  }));
})()