import { Socket } from 'socket.io';
import ChatSqlite from '../implementation/sqlite/chat.sqlite';
import MessageSqlite from '../implementation/sqlite/message.sqlite';
import UserchatSqlite from '../implementation/sqlite/userChat.sqlite';

import ChatRequest from '../models/request/chat.request';
import MessageRequest from '../models/request/message.request';
import UserNeo4j from '../implementation/neo4j/user.neo4j';

import ChatDao from '../models/dao/chat.dao';
import MessageDao from '../models/dao/message.dao';
import UserDao from '../models/dao/user.dao';

const messageDao = new MessageDao(new MessageSqlite());
const userDao = new UserDao(new UserNeo4j());
const chatDao = new ChatDao(new ChatSqlite, new UserchatSqlite(), new MessageSqlite());

const addListenersForSocket = (socket: Socket) => {

  socket.on('get_chats', async () => {
    socket.join(socket.request.session.userId);
    const chats = await chatDao.getChatsAndMessagesRelatedToUser(socket.request.session.userId);
    const seen: { [key: string]: boolean } = {};
    for (const _chat of chats) {
      const { chatId } = _chat;
      if (chatId === undefined) {
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
    const { recipients, content } = data;

    const firstMessage: MessageRequest = {
      content,
      userId,
    };

    const chatRequest: ChatRequest = {
      userId, recipients, messages: [firstMessage]
    };

    const createdChat = await chatDao.create(chatRequest, content);
    socket.join(`chat/${createdChat?.id}`);
    console.log('created chat', createdChat);
    socket.emit('chat_created', createdChat);
    for (const recipient of data.recipients) {
      if (recipient === userId)
        continue;
      socket.to(recipient.uid).emit('user_invited_you', createdChat);
    }
  });


  socket.on('post_message', async (message) => {
    const createdMessageId = (await messageDao.create({
      userId: socket.request.session.userId,
      chatId: message.chatId,
      content: message.content
    })).lastID;

    socket.emit('posted_message', createdMessageId);
    socket.to(`chat/${message.chatId}`).emit('user_posted_message', { ...message, messageId: createdMessageId, date: Date.now(), id: createdMessageId });
  });

  socket.on('writing', async ({ chatId }) => {
    const user = await userDao.findByUserId(socket.request.session.userId);
    socket.to(`chat/${chatId}`).emit('user_writing', { user, chatId });
  });

  socket.on('webrtc:message', (data) => {
    const { chatId } = data;

    data.userId = socket.request.session.userId;
    if (data.type === 'offer' && data.initiator)
      socket.to(data.initiator).emit('webrtc:message', data);
    else if (data.type === 'answer' && data.responder)
      socket.to(data.responder).emit('webrtc:message', data);
    else if (data.type === 'self-call') {
      socket.emit('webrtc:message', {type: 'self-call', chatId});
    } else
      socket.to(`chat/${chatId}`).emit('webrtc:message', data);

  });

};

export default addListenersForSocket;