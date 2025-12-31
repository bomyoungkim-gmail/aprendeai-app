export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export class Notification {
  constructor(
    public readonly id: string,
    public readonly targetUserId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly message: string,
    public readonly data: Record<string, any> = {},
    public readonly priority: NotificationPriority = 'MEDIUM',
    public readonly channels: ('EMAIL' | 'WEBSOCKET' | 'PUSH')[] = ['WEBSOCKET'],
    public readonly createdAt: Date = new Date(),
  ) {}
}
