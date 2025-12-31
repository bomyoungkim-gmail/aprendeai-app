export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export declare class Notification {
    readonly id: string;
    readonly targetUserId: string;
    readonly type: string;
    readonly title: string;
    readonly message: string;
    readonly data: Record<string, any>;
    readonly priority: NotificationPriority;
    readonly channels: ('EMAIL' | 'WEBSOCKET' | 'PUSH')[];
    readonly createdAt: Date;
    constructor(id: string, targetUserId: string, type: string, title: string, message: string, data?: Record<string, any>, priority?: NotificationPriority, channels?: ('EMAIL' | 'WEBSOCKET' | 'PUSH')[], createdAt?: Date);
}
