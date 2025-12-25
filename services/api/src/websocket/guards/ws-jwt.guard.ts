import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        throw new WsException("No token provided");
      }

      const payload = await this.jwtService.verifyAsync(token);

      // Attach user to socket for later use
      client.data.user = {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
      };

      return true;
    } catch (error) {
      throw new WsException("Invalid or expired token");
    }
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    // Token can be passed in auth object or query params
    const token = client.handshake.auth?.token || client.handshake.query?.token;

    // Handle "Bearer <token>" format
    if (typeof token === "string") {
      return token.startsWith("Bearer ") ? token.substring(7) : token;
    }

    return undefined;
  }
}
