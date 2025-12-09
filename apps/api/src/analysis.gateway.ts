import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AnalysisGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection() {
    console.log('Client connected');
  }

  handleDisconnect() {
    console.log('Client disconnected');
  }

  notifyProgress(analysisId: string, data: any) {
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            event: 'analysis-progress',
            data: {
              analysisId,
              ...data,
            },
          }),
        );
      }
    });
  }
}
