import { Injectable } from "@nestjs/common";
import { GetRecommendationsUseCase } from "./application/use-cases/get-recommendations.use-case";

export { RecommendationContent } from "./domain/interfaces/recommendation.repository.interface";

@Injectable()
export class RecommendationService {
  constructor(
    private readonly getRecommendationsUseCase: GetRecommendationsUseCase,
  ) {}

  /**
   * Get all recommendations for user
   */
  async getRecommendations(userId: string) {
    return this.getRecommendationsUseCase.execute(userId);
  }
}
