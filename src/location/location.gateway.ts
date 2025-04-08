// location.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { DeliveryMenService } from '../delivery-men/delivery-men.service';
  
  @WebSocketGateway({ cors: true })
  export class LocationGateway {
    @WebSocketServer()
    server: Server;
  
    constructor(private readonly usersService: DeliveryMenService) {}
  
    @SubscribeMessage('locationUpdate')
    async handleLocationUpdate(
      @MessageBody() data: any,
      @ConnectedSocket() client: Socket,
    ) {
      try {
        let parsedData = data;
        const fixed = parsedData
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"');

        parsedData = JSON.parse(fixed);
        const userId = parsedData.userId;
        const latitude = parsedData.lat;
        const longitude = parsedData.lng;
    
        if (isNaN(userId) || isNaN(latitude) || isNaN(longitude)) {
          throw new Error('Invalid location data');
        }
    
        await this.usersService.updateLocation(userId, latitude, longitude);
      } catch (error) {
        console.error('Failed to update location:', error.message);
        client.emit('error', 'Invalid location payload');
      }
    }
    

    
  }
  