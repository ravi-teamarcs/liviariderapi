import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway({ cors: { origin: '*' } }) // Enable CORS for frontend connections
  export class OrderGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    
    @WebSocketServer()
    server: Server;
  
    afterInit(server: Server) {
      console.log('WebSocket Server Initialized');
    }
  
    handleConnection(client: Socket) {
      console.log(`Client connected: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      console.log(`Client disconnected: ${client.id}`);
    }
  
    // Handle order status updates
    @SubscribeMessage('updateOrderStatus')
    handleOrderUpdate(@MessageBody() data: { orderId: string; status: string }) {
      console.log('Order status update received:', data);
      this.server.emit('orderStatusUpdated', data); // Broadcast update to all clients
    }
  
    // Handle delivery location updates
    @SubscribeMessage('updateLocation')
    handleLocationUpdate(@MessageBody() data: { orderId: string; lat: number; lng: number }) {
      console.log('Delivery location update:', data);
      this.server.emit(`locationUpdate-${data.orderId}`, data); // Notify clients tracking this order
    }
  }
  