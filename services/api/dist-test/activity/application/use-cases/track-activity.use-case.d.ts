import { IActivityRepository } from '../../domain/interfaces/activity.repository.interface';
export declare class TrackActivityUseCase {
    private readonly activityRepo;
    constructor(activityRepo: IActivityRepository);
    execute(userId: string, type: 'study' | 'annotation' | 'read' | 'session', minutes?: number): Promise<void>;
}
