import { PrismaService } from '../../../prisma/prisma.service';
import { IPaymentMethodRepository } from '../../domain/interfaces/payment-method.repository.interface';
import { PaymentMethod } from '../../domain/entities/payment-method.entity';
export declare class PrismaPaymentMethodRepository implements IPaymentMethodRepository {
    private prisma;
    constructor(prisma: PrismaService);
    create(method: PaymentMethod): Promise<PaymentMethod>;
    findById(id: string): Promise<PaymentMethod | null>;
    findByUser(userId: string): Promise<PaymentMethod[]>;
    setDefault(id: string): Promise<PaymentMethod>;
    delete(id: string): Promise<void>;
    private mapToEntity;
}
