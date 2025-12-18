import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/assessment.dto';

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) {}

  async create(createAssessmentDto: CreateAssessmentDto) {
    const { questions, ...data } = createAssessmentDto;
    
    return this.prisma.assessment.create({
      data: {
        ...data,
        questions: {
          create: questions.map(q => ({
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

  findAll() {
    return this.prisma.assessment.findMany();
  }
}
