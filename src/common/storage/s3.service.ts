import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
    private readonly logger = new Logger(S3Service.name);
    private readonly s3Client: S3Client;

    constructor() {
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-2',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
    }

    async uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
        const bucketName = process.env.AWS_S3_BUCKET!;
        try {
            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                    Body: buffer,
                    ContentType: contentType,
                }),
            );
            console.log(`[S3-DEBUG] Archivo subido a: products/${key}`);
            return `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
        } catch (error) {
            this.logger.error(`❌ Error subiendo a S3: ${error.message}`);
            throw error;
        }
    }
}