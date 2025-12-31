import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { PromptMessageDto } from "../sessions/dto/prompt-message.dto";
import { AgentTurnResponseDto } from "../sessions/dto/agent-turn-response.dto";
export declare class AiServiceClient {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly AI_SERVICE_URL;
    private readonly AI_SERVICE_SECRET;
    constructor(httpService: HttpService, configService: ConfigService);
    private signRequest;
    sendPrompt(promptMessage: PromptMessageDto): Promise<AgentTurnResponseDto>;
}
