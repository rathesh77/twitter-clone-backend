import { RunResult } from 'sqlite3'
import ChatInterface from '../../interface/chat.interface';
import UserChatInterface from '../../interface/userChat.interface';
import MessageInterface from '../../interface/message.interface';

class ChatDao implements ChatInterface{

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
  async create(data: ChatDto, messageContent: string): Promise<RunResult> {
    return await new Promise(async (resolve, reject) => {
      try {
        let runResult: RunResult
        runResult = await this.chatImplementation.create(data)
        //return runResult
        const chatId = runResult.lastID
        runResult = await this.userChatImplementation.create(new UserChatDto({ chatId, userId: data.userId }))
        for (const recipient of data.recipients!) {
          const recipientId = recipient.uid
          runResult = await this.userChatImplementation.create(new UserChatDto({ chatId, userId: recipientId }))

        }
        const {userId} = data
        runResult = await this.messageImplementation.create(new MessageDto({content: messageContent, userId, chatId, date:Date.now()}))
        resolve(runResult)
      } catch (error) {
        console.error(`Something went wrong: ${error}`);
      } finally {
      }
    })
  }

  async getChatsAndMessagesRelatedToUser(userId: string): Promise<ChatMessageDto[]> {
    return await this.chatImplementation.getChatsAndMessagesRelatedToUser(userId)

  }
}

export default ChatDao