import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        // Console transport para desenvolvimento
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, stack }) => {
              const ctx = context ? `[${context}]` : '';
              return `${timestamp} ${level} ${ctx} ${message}${stack ? '\n' + stack : ''}`;
            }),
          ),
        }),
        // File transport para produção
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: logFormat,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: logFormat,
        }),
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
