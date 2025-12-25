import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";

export interface ContentClassification {
  ageMin: number;
  ageMax: number;
  contentRating: "G" | "PG" | "PG-13" | "TEEN";
  complexity: "BASIC" | "INTERMEDIATE" | "ADVANCED";
  topics: string[];
  confidence: number; // 0-1
}

@Injectable()
export class ContentClassificationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Classify content using AI analysis (hybrid approach)
   * AI suggests, admin can review
   */
  async classifyContent(content: {
    title: string;
    description?: string;
    body?: string;
    existingClassification?: Partial<ContentClassification>;
  }): Promise<ContentClassification> {
    // If admin already classified, return it
    if (
      content.existingClassification?.ageMin &&
      content.existingClassification?.ageMax
    ) {
      return content.existingClassification as ContentClassification;
    }

    // AI Classification
    const aiClassification = await this.aiClassify(content);

    // If admin partially classified, merge with AI suggestions
    if (content.existingClassification) {
      return {
        ...aiClassification,
        ...content.existingClassification,
      };
    }

    return aiClassification;
  }

  /**
   * AI-powered classification
   */
  private async aiClassify(content: {
    title: string;
    description?: string;
    body?: string;
  }): Promise<ContentClassification> {
    const aiUrl = this.configService.get("AI_SERVICE_URL");
    const secret = this.configService.get("AI_SERVICE_SECRET");

    try {
      const response = await lastValueFrom(
        this.httpService.post(
          `${aiUrl}/classify-content`,
          {
            title: content.title,
            description: content.description,
            body: content.body,
          },
          {
            headers: {
              "X-Hub-Signature": secret, // Using simple secret for now as per Phase 0
            },
          },
        ),
      );

      return {
        ageMin: response.data.ageMin,
        ageMax: response.data.ageMax,
        contentRating: this.determineRating(response.data.ageMin),
        complexity: response.data.complexity,
        topics: response.data.topics,
        confidence: response.data.confidence,
      };
    } catch (error) {
      console.error(
        "AI Classification failed, falling back to local heuristic",
        error.message,
      );
      // Fallback to local heuristic
      const text =
        `${content.title} ${content.description || ""} ${content.body || ""}`.toLowerCase();
      const keywords = this.extractKeywords(text);
      const complexity = this.determineComplexity(text, keywords);
      const ageRange = this.determineAgeRange(keywords, complexity);

      return {
        ...ageRange,
        contentRating: this.determineRating(ageRange.ageMin),
        complexity,
        topics: keywords.slice(0, 5),
        confidence: 0.6,
      };
    }
  }

  private extractKeywords(text: string): string[] {
    // Educational keywords by difficulty
    const basicKeywords = [
      "abc",
      "números",
      "cores",
      "formas",
      "animais",
      "família",
    ];
    const intermediateKeywords = [
      "multiplicação",
      "divisão",
      "frações",
      "história",
      "geografia",
    ];
    const advancedKeywords = [
      "álgebra",
      "química",
      "física",
      "filosofia",
      "cálculo",
    ];

    const allKeywords = [
      ...basicKeywords,
      ...intermediateKeywords,
      ...advancedKeywords,
    ];

    return allKeywords.filter((keyword) => text.includes(keyword));
  }

  private determineComplexity(
    text: string,
    keywords: string[],
  ): "BASIC" | "INTERMEDIATE" | "ADVANCED" {
    const advancedTopics = [
      "álgebra",
      "química",
      "física",
      "filosofia",
      "cálculo",
      "trigonometria",
    ];
    const intermediateTopics = [
      "multiplicação",
      "divisão",
      "frações",
      "história",
      "geografia",
    ];

    if (keywords.some((k) => advancedTopics.includes(k))) return "ADVANCED";
    if (keywords.some((k) => intermediateTopics.includes(k)))
      return "INTERMEDIATE";
    return "BASIC";
  }

  private determineAgeRange(
    keywords: string[],
    complexity: string,
  ): { ageMin: number; ageMax: number } {
    const ranges = {
      BASIC: { ageMin: 4, ageMax: 8 },
      INTERMEDIATE: { ageMin: 8, ageMax: 12 },
      ADVANCED: { ageMin: 12, ageMax: 18 },
    };

    return ranges[complexity] || { ageMin: 6, ageMax: 12 };
  }

  private determineRating(ageMin: number): "G" | "PG" | "PG-13" | "TEEN" {
    if (ageMin <= 6) return "G";
    if (ageMin <= 10) return "PG";
    if (ageMin <= 13) return "PG-13";
    return "TEEN";
  }

  /**
   * Filter content based on family settings
   */
  filterContentByAge(
    items: any[],
    familyAgeRange: { minAge: number; maxAge: number },
  ): any[] {
    return items.filter((item) => {
      if (!item.ageMin || !item.ageMax) return true; // Unclassified content passes through

      // Content must be within family's allowed range
      return (
        item.ageMin >= familyAgeRange.minAge &&
        item.ageMax <= familyAgeRange.maxAge
      );
    });
  }

  /**
   * Suggest classification to admin (for review)
   */
  async suggestClassification(
    contentId: string,
    title: string,
    description?: string,
  ) {
    const classification = await this.aiClassify({ title, description });

    return {
      contentId,
      suggested: classification,
      message: `AI suggests: Age ${classification.ageMin}-${classification.ageMax}, ${classification.complexity} level (${Math.round(classification.confidence * 100)}% confidence)`,
      needsReview: classification.confidence < 0.8, // Flag for admin review if low confidence
    };
  }
}
