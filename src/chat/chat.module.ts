import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway'; // <- Importe o Gateway

@Module({
  providers: [ChatGateway], // <- Adicione aqui!
})
export class ChatModule {}
