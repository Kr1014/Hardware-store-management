import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = exception instanceof HttpException
      ? exception.getResponse()
      : { message: 'Error interno del servidor' };

    // Registra el error original sin enviarlo al cliente.
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error('🔥 [CRITICAL SERVER ERROR]:', exception);
    }

    const message = typeof errorResponse === 'object' && errorResponse !== null && 'message' in errorResponse 
      ? errorResponse['message'] 
      : errorResponse;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
