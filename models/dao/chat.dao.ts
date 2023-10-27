import ChatInterface from '../../interface/chat.interface';
import UserChatInterface from '../../interface/userChat.interface';
import MessageInterface from '../../interface/message.interface';
import ChatDto from '../dto/chat.dto';
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
    this.chatImplementation = chatImplementation;
    this.userChatImplementation = userChatImplementation;
    this.messageImplementation = messageImplementation;

  }

  async create(chatRequest: ChatRequest, messageContent: string): Promise<ChatDto | null> {
    return await (async () => {
      try {
        const chatDto = await this.chatImplementation.create(chatRequest);
        //return runResult
        const chatId = chatDto.lastID;
        await this.userChatImplementation.create(({ chatId, userId: chatRequest.userId }));

        for (const recipient of chatRequest.recipients!) {
          const recipientId = recipient.uid;
          await this.userChatImplementation.create(({ chatId, userId: recipientId }));

        }
        const {userId} = chatRequest;
        await this.messageImplementation.create({content: messageContent, userId, chatId, date:Date.now()} as MessageDto);
        return (await this.chatImplementation.findById(chatId));
      } catch (error) {
        console.error(`Something went wrong: ${error}`);
      }
      return null;
    })();
  }

  async getChatsAndMessagesRelatedToUser(userId: string): Promise<MessageDto[]> {
    return await this.chatImplementation.getChatsAndMessagesRelatedToUser(userId);

  }
}

export default ChatDao;