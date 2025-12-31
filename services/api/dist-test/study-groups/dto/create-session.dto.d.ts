import { GroupSessionMode } from "@prisma/client";
export declare class CreateSessionDto {
    content_id: string;
    mode?: GroupSessionMode;
    layer?: string;
    rounds_count: number;
}
