import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMService } from '../../llm/llm.service';

export interface SimplificationResult {
  simplifiedText: string;
  summary: string;
}

export interface AssessmentQuestion {
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface AssessmentResult {
  questions: AssessmentQuestion[];
}

@Injectable()
export class AIContentService {
  private readonly logger = new Logger(AIContentService.name);

  constructor(
    private configService: ConfigService,
    private llmService: LLMService
  ) {}

  async simplifyText(params: {
    text: string;
    targetLevel: string;
    targetLanguage: string;
  }): Promise<SimplificationResult> {
    const { text, targetLevel, targetLanguage } = params;
    
    // Check if any AI is available (LLMService handles provider check)
    // Actually LLMService.generateText handles checking internally
    
    const levelDescriptions: Record<string, string> = {
      '1_EF': 'primeira série do ensino fundamental (6-7 anos)',
      '2_EF': 'segunda série do ensino fundamental (7-8 anos)',
      '3_EF': 'terceira série do ensino fundamental (8-9 anos)',
      '4_EF': 'quarta série do ensino fundamental (9-10 anos)',
      '5_EF': 'quinta série do ensino fundamental (10-11 anos)',
      '6_EF': 'sexta série do ensino fundamental (11-12 anos)',
      '7_EF': 'sétima série do ensino fundamental (12-13 anos)',
      '8_EF': 'oitava série do ensino fundamental (13-14 anos)',
      '9_EF': 'nona série do ensino fundamental (14-15 anos)',
      '1_EM': 'primeira série do ensino médio (15-16 anos)',
      '2_EM': 'segunda série do ensino médio (16-17 anos)',
      '3_EM': 'terceira série do ensino médio (17-18 anos)',
    };

    const prompt = `
Você é um professor especializado em adaptar textos pedagógicos.

TAREFA: Simplifique o texto abaixo para o nível de ${levelDescriptions[targetLevel] || targetLevel}.

REQUISITOS:
- Use vocabulário apropriado para a idade
- Frases curtas e diretas
- Explique termos complexos de forma simples
- Mantenha as ideias principais
- Idioma: ${targetLanguage === 'PT_BR' ? 'Português do Brasil' : targetLanguage}

TEXTO ORIGINAL:
${text}

FORMATO DE RESPOSTA (JSON ONLY):
{
  "simplifiedText": "texto simplificado aqui",
  "summary": "resumo breve em 1-2 frases"
}
`;

    try {
      // Use LLMService for multi-provider support (Gemini -> OpenAI -> Fallback)
      const result = await this.llmService.generateText(prompt, { 
        temperature: 0.3,
        maxTokens: 2000,
      });

      const response = result.text;
      
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          simplifiedText: parsed.simplifiedText,
          summary: parsed.summary,
        };
      }
      
      // Fallback: treat entire response as simplified text
      return {
        simplifiedText: response,
        summary: `Texto simplificado para ${targetLevel}`,
      };
    } catch (error) {
      // LLMService already handles retries and provider failover.
      // If we are here, ALL providers failed or Quota exceeded on all.
      
      this.logger.error(`AI Simplification full failure: ${error.message}`);
      
      // Bubble up specific errors for QueueConsumer to handle (e.g. Quota)
      if (error.message?.includes('QUOTA') || error.message?.includes('rate limit')) {
         throw new Error('QUOTA_EXCEEDED');
      }
      
      throw new Error('AI_PROCESSING_ERROR');
    }
  }

  async generateAssessment(params: {
    text: string;
    level: string;
    questionCount?: number;
  }): Promise<AssessmentResult> {
    const { text, level, questionCount = 5 } = params;

    const prompt = `
Você é um professor criando questões de avaliação.

TAREFA: Crie ${questionCount} questões de múltipla escolha baseadas no texto abaixo, apropriadas para o nível ${level}.

REQUISITOS:
- Questões claras e objetivas
- 4 alternativas por questão
- Apenas 1 alternativa correta
- Explicação para a resposta correta
- Variar dificuldade das questões

TEXTO:
${text.substring(0, 3000)}

FORMATO DE RESPOSTA (JSON Array ONLY):
[
  {
    "questionText": "Pergunta aqui?",
    "questionType": "MULTIPLE_CHOICE",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctAnswer": "Opção A",
    "explanation": "Explicação da resposta correta"
  }
]
`;

    try {
      const result = await this.llmService.generateText(prompt, {
        temperature: 0.5,
      });

      const response = result.text;
      
      // Try to parse JSON array
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        return { questions };
      }
      
      throw new Error('Could not parse AI response');
    } catch (error) {
      this.logger.error(`AI Assessment generation failure: ${error.message}`);

      if (error.message?.includes('QUOTA') || error.message?.includes('rate limit')) {
         throw new Error('QUOTA_EXCEEDED');
      }

      throw new Error('AI_PROCESSING_ERROR');
    }
  }
}
