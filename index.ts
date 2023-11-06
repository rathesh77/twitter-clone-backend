/* eslint-disable @typescript-eslint/no-explicit-any */
import cors from 'cors';
import session from 'express-session';
import bodyParser from 'body-parser';
import { Server, Socket } from 'socket.io';
import express from 'express';
import http from 'http';
import Neo4jDB from './database/neo4j.database';
import tweetRoutes from './routes/tweet.routes';
import userRoutes from './routes/user.routes';

import neo4jDatabase from './database/neo4j.database';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _ from './types';
import addListenersForSocket from './socket-io/socket-listeners';
import localIps from './get-local-ips'


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
  origin: localIps
}));
app.use(sessionMiddleware);
app.use('/', userRoutes);
app.use('/', tweetRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: localIps,
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


(async () => {

  Neo4jDB!.connect();
 
  io.on('connection', (socket) => {
    console.log('a user connected');
    socket.emit('message');
    addListenersForSocket(socket);
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