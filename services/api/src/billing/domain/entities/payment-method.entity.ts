export class PaymentMethod {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly provider: string,
    public readonly last4: string,
    public readonly expMonth: number,
    public readonly expYear: number,
    public readonly isDefault: boolean,
    public readonly encryptedDetails: string,
    public readonly metadata?: Record<string, any>,
  ) {}
}
