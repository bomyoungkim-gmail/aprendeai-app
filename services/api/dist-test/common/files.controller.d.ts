import { Response } from "express";
import { StorageService } from "../cornell/services/storage.service";
import { ContentAccessService } from "../cornell/services/content-access.service";
export declare class FilesController {
    private storageService;
    private contentAccessService;
    constructor(storageService: StorageService, contentAccessService: ContentAccessService);
    viewFile(id: string, res: Response, req: any): Promise<void>;
    getViewUrl(id: string, req: any): Promise<{
        url: string;
        expiresAt: string;
    }>;
}
