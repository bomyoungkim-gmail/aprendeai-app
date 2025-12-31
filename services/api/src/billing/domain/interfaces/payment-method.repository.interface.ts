export interface IPaymentMethodRepository {
  create(method: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findByUser(userId: string): Promise<any[]>;
  setDefault(id: string): Promise<any>;
  delete(id: string): Promise<void>;
}

export const IPaymentMethodRepository = Symbol("IPaymentMethodRepository");
