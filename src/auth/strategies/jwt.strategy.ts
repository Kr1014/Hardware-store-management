import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET') || 'fallback-secret',
        });
    }

    async validate(payload: any) {
        // Es vital que el payload del token contenga el role. 
        // Si al hacer login no lo metiste en el payload, aquí llegará undefined.
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role // <--- ESTO ES LO QUE TE FALTA
        };
    }
}
