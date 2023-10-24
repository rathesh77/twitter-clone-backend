/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import bodyParser from 'body-parser';
import { Server, Socket } from 'socket.io';
import fs from 'fs';
import express from 'express';
import http from 'http';
import Neo4jDB from './database/neo4j.database';
import tweetRoutes from './routes/tweet.routes';
import userRoutes from './routes/user.routes';

import initData from './initData';
import ChatDao from './models/dao/chat.dao';
import ChatSqlite from './implementation/sqlite/chat.sqlite';
import neo4jDatabase from './database/neo4j.database';
import UserDao from './models/dao/user.dao';
import TweetDao from './models/dao/tweet.dao';
import TweetNeo4j from './implementation/neo4j/tweet.neo4j';
import UserNeo4j from './implementation/neo4j/user.neo4j';
import UserchatSqlite from './implementation/sqlite/userChat.sqlite';
import MessageSqlite from './implementation/sqlite/message.sqlite';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _ from './types';
import MessageRequest from './models/request/message.request';
import ChatRequest from './models/request/chat.request';
import MessageDao from './models/dao/message.dao';

const chatDao = new ChatDao(new ChatSqlite, new UserchatSqlite(), new MessageSqlite());
const messageDao = new MessageDao(new MessageSqlite());
const userDao = new UserDao(new UserNeo4j());

const app = express();
const sessionMiddleware = session({
  secret: 'toto',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
  }
});


app.use(express.static('uploads'));
app.use(bodyParser.json());
app.use(cors({
  credentials: true,
  origin: ['http://localhost:3000', 'http://192.168.0.21:3000']
}));
app.use(sessionMiddleware);
app.use('/', userRoutes);
app.use('/', tweetRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
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
    next(new Error('unauthorized'));
  }
});

dotenv.config();

(async () => {

  Neo4jDB!.connect();
  if (process.argv.includes('initData')) {
    fs.readdir('uploads', function (err, files) {
      files.forEach(f => fs.rmSync('uploads/' + f));
    });
    initData(Neo4jDB, new UserDao(new UserNeo4j()), new TweetDao(new TweetNeo4j()));
  }

  io.on('connection', (socket) => {
    console.log('a user connected');
    socket.emit('message');

    socket.on('get_chats', async (data) => {
      //Chat.create(data)
      socket.join(socket.request.session.userId);
      const chats = await chatDao.getChatsAndMessagesRelatedToUser(data.uid);
      const seen: any = {};
      for (const _chat of chats) {
        const { chatId } = _chat;
        if (chatId === undefined ){
          continue;
        }
        if (!seen[chatId]) {
          seen[chatId] = true;
          if (!socket.rooms.has(`chat/${chatId}`))
            socket.join(`chat/${chatId}`);
        }
      }
      socket.emit('chats_list', chats);
    });

    socket.on('create_chat', async (data) => {
      const userId = socket.request.session.userId;
      const {recipients, content} = data;
      
      const firstMessage: MessageRequest = {
        content,
        userId,
      };

      const chatRequest: ChatRequest= {
        userId, recipients, messages: [firstMessage]
      };

      const createdChat = await chatDao.create(chatRequest, content);
      console.log('created chat', createdChat);
      socket.emit('chat_created', createdChat);
      for (const recipient of data.recipients) {
        if (recipient === userId)
          continue;
        socket.to(recipient.uid).emit('user_invited_you', createdChat);
      }
    });

    socket.on('join', async (chatId) => {
      socket.join(`chat/${chatId}`);
    });

    socket.on('post_message', async (message) => {
      const createdMessageId = (await messageDao.create({
        userId: message.author,
        chatId: message.chatId,
        content: message.content
      })).lastID;

      socket.emit('posted_message', createdMessageId);
      socket.to(`chat/${message.chatId}`).emit('user_posted_message', { ...message, messageId: createdMessageId, date: Date.now() });
    });

    socket.on('writing', async ({ chatId }) => {
      const user = await userDao.findByUserId(socket.request.session.userId);
      socket.to(`chat/${chatId}`).emit('user_writing', { user, chatId });
    });

    socket.on('webrtc:message', (data) =>  {
      const { chatId } = data;

      if (data.type === 'offer' && data.initiator) 
        socket.to(data.initiator).emit('webrtc:message', data);
      else if (data.type === 'answer' && data.responder)
        socket.to(data.responder).emit('webrtc:message', data);
      else
        socket.to(`chat/${chatId}`).emit('webrtc:message', data);
      
    });
  });


  server.listen(8080, function () {
    console.log('app is listening on port 8080');
  });

  server.on('close', (async (err: any) => {
    neo4jDatabase?.close();
    console.log('server closed');
    await neo4jDatabase!.close();
    process.exit(err ? 1 : 0);
  }));
})();