import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];
        
        const expectedApiKey = this.configService.get<string>('N8N_API_KEY');
        
        if (!expectedApiKey) {
            throw new UnauthorizedException('API Key no configurada en el servidor');
        }

        if (apiKey !== expectedApiKey) {
            throw new UnauthorizedException('API Key inválida');
        }

        return true;
    }
}
