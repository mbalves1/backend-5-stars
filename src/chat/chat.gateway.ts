import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Set<string>> = new Map();
  private users: Map<
    string,
    { socketId: string; username: string; roomId?: string }
  > = new Map();

  handleConnection(client: Socket) {
    console.log('Client connected', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected', client.id);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; username: string },
  ) {
    const { roomId, username } = payload;
    client.join(roomId);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(client.id);

    this.users.set(client.id, {
      socketId: client.id,
      username,
      roomId,
    });
    console.log(`${username} entrou na sala ${roomId}`);
    client.to(roomId).emit('userJoined', { username, roomId });
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; message: string },
  ) {
    client.emit('testeResponse', { success: true, data: payload });
    console.log('📨 Payload recebido:', payload); // <- E ISSO

    const { roomId, message } = payload;
    const user = this.users.get(client.id);

    console.log('👤 Usuário encontrado:', user); // <- E ISSO

    if (!user || user.roomId !== roomId) {
      console.log('❌ Usuário não encontrado ou sala incorreta'); // <- E ISSO
      return;
    }
    const messageData = {
      username: user.username,
      message,
      roomId,
      timestamp: new Date(),
    };
    console.log('📤 Enviando mensagem:', messageData);
    const usersInRoom = this.getUsersInRoom(roomId);
    console.log('👥 Usuários na sala:', usersInRoom);
    this.server.to(roomId).emit('newMessage', messageData);
  }

  private getUsersInRoom(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room).map((socketId) => {
      const user = this.users.get(socketId);
      return user ? user.username : 'Unknown';
    });
  }
}
