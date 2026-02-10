import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';

@Global()
@Module({
    providers: [MailService],
    exports: [MailService], // Para que el CartService pueda usarlo
})
export class MailModule { }