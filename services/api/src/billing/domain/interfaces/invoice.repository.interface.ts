export interface IInvoiceRepository {
  create(invoice: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findBySubscription(subscriptionId: string): Promise<any[]>;
  update(id: string, data: Partial<any>): Promise<any>;
}

export const IInvoiceRepository = Symbol("IInvoiceRepository");
