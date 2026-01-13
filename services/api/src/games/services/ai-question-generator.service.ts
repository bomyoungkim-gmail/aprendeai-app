import { Injectable, Logger } from "@nestjs/common";
import { LLMService } from "../../llm/llm.service";
import { GenerateQuestionsDto } from "../dto/generate-questions.dto";
import {
  TabooQuestion,
  TabooAnswer,
  SRSQuestion,
  SRSAnswer,
  FreeRecallQuestion,
  FreeRecallAnswer,
} from "../types/game-question-types";

@Injectable()
export class AIQuestionGeneratorService {
  private readonly logger = new Logger(AIQuestionGeneratorService.name);

  constructor(private llmService: LLMService) {}

  async generate(params: GenerateQuestionsDto) {
    const language = params.language || "pt-BR";

    // SCRIPT 01: Apply default values for syntax-related games
    if (!params.subject || params.subject.trim() === "") {
      params.subject = "Português";
    }
    if (!params.topic || params.topic.trim() === "") {
      params.topic = "Sintaxe: oração e sentença";
    }

    try {
      switch (params.gameType) {
        case "CONCEPT_LINKING":
          return await this.generateTabooQuestions(params, language);
        case "SRS_ARENA":
          return await this.generateSRSQuestions(params, language);
        case "FREE_RECALL_SCORE":
          return await this.generateFreeRecallQuestions(params, language);

        // SCRIPT 01: New syntax analysis game types (placeholder implementation)
        case "SENTENCE_SKELETON":
          throw new Error(
            "SENTENCE_SKELETON game type not yet implemented. This will require integration with syntax analysis service.",
          );
        case "CONNECTOR_CLASSIFIER":
          throw new Error(
            "CONNECTOR_CLASSIFIER game type not yet implemented. This will require integration with syntax analysis service.",
          );
        case "CLAUSE_REWRITE_SIMPLE":
          throw new Error(
            "CLAUSE_REWRITE_SIMPLE game type not yet implemented. This will require integration with syntax analysis service.",
          );

        default:
          throw new Error(`Unsupported game type: ${params.gameType}`);
      }
    } catch (error) {
      this.logger.error(`Failed to generate questions: ${error.message}`);
      throw error;
    }
  }

  private async generateTabooQuestions(
    params: GenerateQuestionsDto,
    language: string,
  ) {
    const prompt = `Generate ${params.count} Taboo-style questions about "${params.topic}" (${params.subject}) 
for ${params.educationLevel} education level in ${language}.

For each question, provide:
- targetWord: the word to be described
- forbiddenWords: exactly 4 related forbidden words
- requiredKeywords: 2-3 keywords that must appear in a good description
- validExamples: 2 example descriptions

Return JSON: { questions: [{ targetWord, forbiddenWords, requiredKeywords, validExamples }] }`;

    const result = await this.llmService.generateText(prompt, {
      temperature: 0.8,
      model: "gpt-4",
    });

    const data = JSON.parse(result.text);
    return data.questions.map((q: any) => ({
      question: {
        targetWord: q.targetWord,
        forbiddenWords: q.forbiddenWords,
      } as TabooQuestion,
      answer: {
        type: "criteria",
        requiredKeywords: q.requiredKeywords || [],
        forbiddenKeywords: q.forbiddenWords,
        minWords: 5,
        maxWords: 50,
        validExamples: q.validExamples || [],
        scoring: {
          noForbidden: 40,
          hasRequired: 30,
          goodLength: 20,
          clarity: 10,
        },
      } as TabooAnswer,
    }));
  }

  private async generateSRSQuestions(
    params: GenerateQuestionsDto,
    language: string,
  ) {
    const prompt = `Generate ${params.count} flashcard questions about "${params.topic}" (${params.subject})
for ${params.educationLevel} education level in ${language}.

For each question, provide:
- question: a clear question
- correct: the correct answer
- acceptableVariations: 2-3 acceptable alternative answers
- keywords: key terms that should appear in the answer

Return JSON: { questions: [{ question, correct, acceptableVariations, keywords }] }`;

    const result = await this.llmService.generateText(prompt, {
      temperature: 0.7,
      model: "gpt-4",
    });

    const data = JSON.parse(result.text);
    return data.questions.map((q: any) => ({
      question: {
        question: q.question,
      } as SRSQuestion,
      answer: {
        type: "exact",
        correct: q.correct,
        acceptableVariations: q.acceptableVariations || [],
        keywords: q.keywords || [],
        scoring: {
          exactMatch: 100,
          hasAllKeywords: 80,
          hasSomeKeywords: 50,
        },
      } as SRSAnswer,
    }));
  }

  private async generateFreeRecallQuestions(
    params: GenerateQuestionsDto,
    language: string,
  ) {
    const prompt = `Generate ${params.count} free recall prompts about "${params.topic}" (${params.subject})
for ${params.educationLevel} education level in ${language}.

For each prompt, provide:
- topic: the specific topic name
- prompt: instruction to summarize/explain
- mustMentionConcepts: 5-7 key concepts that must be mentioned
- exampleAnswer: a good example answer

Return JSON: { questions: [{ topic, prompt, mustMentionConcepts, exampleAnswer }] }`;

    const result = await this.llmService.generateText(prompt, {
      temperature: 0.7,
      model: "gpt-4",
    });

    const data = JSON.parse(result.text);
    return data.questions.map((q: any) => ({
      question: {
        topic: q.topic,
        prompt: q.prompt,
      } as FreeRecallQuestion,
      answer: {
        type: "self-assessed",
        topic: q.topic,
        mustMentionConcepts: q.mustMentionConcepts || [],
        optionalConcepts: [],
        minWords: 20,
        exampleAnswer: q.exampleAnswer,
        rubric: {
          excellent: {
            description: "Menciona 5+ conceitos essenciais",
            minConcepts: 5,
            minWords: 30,
          },
          good: {
            description: "Menciona 3-4 conceitos",
            minConcepts: 3,
            minWords: 20,
          },
          needs_improvement: {
            description: "Menciona <3 conceitos",
            minConcepts: 0,
            minWords: 10,
          },
        },
        aiEvaluationAvailable: true,
      } as FreeRecallAnswer,
    }));
  }
}
