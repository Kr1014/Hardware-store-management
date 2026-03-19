import { Module, Global } from '@nestjs/common';
import { S3Service } from './s3.service';

@Global() // Esto hace que no tengas que importarlo en cada módulo
@Module({
    providers: [S3Service],
    exports: [S3Service],
})
export class StorageModule { }