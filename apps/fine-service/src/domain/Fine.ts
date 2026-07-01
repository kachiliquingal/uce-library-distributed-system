export type FineStatus = 'UNPAID' | 'PAID';

export class Fine {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly loanId: string,
    public readonly amount: number,
    public readonly reason: string,
    public status: FineStatus,
    public readonly createdAt: Date,
    public stripePaymentIntentId?: string
  ) {}
}
