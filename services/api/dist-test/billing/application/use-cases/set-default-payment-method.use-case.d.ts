import { IPaymentMethodRepository } from '../../domain/interfaces/payment-method.repository.interface';
export declare class SetDefaultPaymentMethodUseCase {
    private paymentMethodRepo;
    constructor(paymentMethodRepo: IPaymentMethodRepository);
    execute(paymentMethodId: string): Promise<void>;
}
