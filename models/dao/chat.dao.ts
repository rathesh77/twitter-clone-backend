import { RunResult } from 'sqlite3'
import ChatInterface from '../../interface/chat.interface';
import UserChatInterface from '../../interface/userChat.interface';
import MessageInterface from '../../interface/message.interface';
import ChatDto from '../dto/chat.dto';
import UserChatDto from '../dto/userChat.dto';
import ChatRequest from '../request/chat.request';
import MessageDto from '../dto/message.dto';


class ChatDao {

  chatImplementation: ChatInterface;
  userChatImplementation: UserChatInterface;
  messageImplementation: MessageInterface;

  constructor(
    chatImplementation: ChatInterface, 
    userChatImplementation: UserChatInterface,
    messageImplementation: MessageInterface  
    /*passer un chatSqlite ici */) {
    this.chatImplementation = chatImplementation
    this.userChatImplementation = userChatImplementation
    this.messageImplementation = messageImplementation

  }

  async create(chatRequest: ChatRequest, messageContent: string): Promise<ChatDto> {
    return await new Promise(async (resolve, reject) => {
      try {
        let runResult: RunResult
        const chatDto = await this.chatImplementation.create(chatRequest)
        //return runResult
        const chatId = chatDto.lastID
        runResult = await this.userChatImplementation.create(new UserChatDto({ chatId, userId: chatRequest.userId }))

        for (const recipient of chatRequest.recipients!) {
          const recipientId = recipient.uid
          runResult = await this.userChatImplementation.create(new UserChatDto({ chatId, userId: recipientId }))

        }
        const {userId} = chatRequest
        runResult = await this.messageImplementation.create({content: messageContent, userId, chatId, date:Date.now()} as MessageDto)
        resolve (await this.chatImplementation.findById(chatId))
      } catch (error) {
        console.error(`Something went wrong: ${error}`);
      } finally {
      }
    })
  }

  async getChatsAndMessagesRelatedToUser(userId: string): Promise<MessageDto[]> {
    return await this.chatImplementation.getChatsAndMessagesRelatedToUser(userId)

  }
}

export default ChatDao