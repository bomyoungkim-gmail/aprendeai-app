import { Module } from '@nestjs/common';
import { ItemBankService } from './item-bank.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ItemBankService],
  exports: [ItemBankService],
})
export class ItemBankModule {}
