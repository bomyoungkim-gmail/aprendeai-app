import { Response } from "express";
import { UnsubscribeUserUseCase } from "./application/use-cases/unsubscribe-user.use-case";
export declare class EmailController {
    private readonly unsubscribeUseCase;
    constructor(unsubscribeUseCase: UnsubscribeUserUseCase);
    unsubscribe(token: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
