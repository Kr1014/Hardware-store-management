import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';  // ← IMPORTA Request
import { AuthService } from './auth.service';
import { LoginDto, CreateUserDto } from './dto';
import { LocalAuthGuard } from './guards';  // ← SOLO LocalAuthGuard para login

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req) {  // ← CAMBIA A @Request() req
        return this.authService.login(req.user);  // ← req.user viene de LocalStrategy
    }
}
