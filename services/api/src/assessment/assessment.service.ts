import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAssessmentDto, SubmitAssessmentDto } from "./dto/assessment.dto";
import { TopicMasteryService } from "../analytics/topic-mastery.service";

@Injectable()
export class AssessmentService {
  constructor(
    private prisma: PrismaService,
    private topicMastery: TopicMasteryService
  ) {}

  async create(createAssessmentDto: CreateAssessmentDto) {
    const { questions, ...data } = createAssessmentDto;

    return this.prisma.assessment.create({
      data: {
        ...data,
        questions: {
          create: questions.map((q) => ({
            questionType: q.questionType,
            questionText: q.questionText,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
          })),
        },
      },
      include: { questions: true },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.assessment.findMany({
      where: {
        content: {
          ownerUserId: userId,
        },
      },
      include: {
        content: {
          select: {
            title: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async submitAssessment(userId: string, assessmentId: string, dto: SubmitAssessmentDto) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: true,
        content: {
          select: {
            metadata: true,
            title: true // verify ownership/access if needed later
          }
        }
      },
    });

    if (!assessment) {
      throw new NotFoundException("Assessment not found");
    }

    let scorePoints = 0;
    let totalTimeSpent = 0;
    const totalQuestions = assessment.questions.length;
    const assessmentAnswers = [];

    // Process answers
    for (const answerDto of dto.answers) {
      const question = assessment.questions.find(q => q.id === answerDto.questionId);
      if (!question) continue;

      const isCorrect = JSON.stringify(question.correctAnswer) === JSON.stringify(answerDto.userAnswer);
      if (isCorrect) scorePoints++;

      assessmentAnswers.push({
        questionId: question.id,
        userAnswer: answerDto.userAnswer,
        isCorrect,
        timeSpentSeconds: answerDto.timeSpentSeconds || 0
      });

      if (answerDto.timeSpentSeconds) {
        totalTimeSpent += answerDto.timeSpentSeconds;
      }
    }

    const scorePercent = totalQuestions > 0 ? (scorePoints / totalQuestions) * 100 : 0;

    // Create Attempt
    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        userId,
        scoreRaw: scorePoints,
        scorePercent,
        finishedAt: new Date(),
        answers: {
          create: assessmentAnswers
        }
      },
    });

    // Update Mastery
    // Check if content has topics
    if (assessment.content?.metadata && typeof assessment.content.metadata === 'object') {
      const metadata = assessment.content.metadata as any;
      if (Array.isArray(metadata.topics)) {
        for (const topic of metadata.topics) {
           // We don't have 'subject' here easily, might need to extract or guess.
           // For now, use 'General' or try to find subject from other metadata?
           // The UserTopicMastery requires subject. 
           // ContentClassification defined: topics: string[]. No subject.
           // Maybe map to a default subject or "Content" subject.
           const subject = "Content"; 
           
           // Heuristic: If 80%+, count as 'correct' equivalent for mastery update?
           // Or update proportionally?
           // The TopicMasteryService.updateMastery takes boolean isCorrect key.
           // Let's call it for each question? No, mastery is per topic.
           // Better: Add a method updateMasteryByScore to TopicMasteryService?
           // OR just use updateMastery but treat > 70% as "Correct".
           
           const passed = scorePercent >= 70;
           // If passed, we increment mastery.
           // We might want to pass more details later.
           await this.topicMastery.updateMastery(userId, topic, subject, passed, 0);
        }
      }
    }

    return attempt;
  }
}
