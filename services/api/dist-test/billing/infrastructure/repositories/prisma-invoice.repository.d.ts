import { PrismaService } from '../../../prisma/prisma.service';
import { IInvoiceRepository } from '../../domain/interfaces/invoice.repository.interface';
import { Invoice } from '../../domain/entities/invoice.entity';
export declare class PrismaInvoiceRepository implements IInvoiceRepository {
    private prisma;
    constructor(prisma: PrismaService);
    create(invoice: Invoice): Promise<Invoice>;
    findById(id: string): Promise<Invoice | null>;
    findBySubscription(subscriptionId: string): Promise<Invoice[]>;
    update(id: string, data: Partial<Invoice>): Promise<Invoice>;
    private mapToEntity;
}
