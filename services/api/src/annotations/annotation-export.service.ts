import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnotationExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export annotations to PDF
   */
  async exportToPDF(userId: string): Promise<Buffer> {
    const annotations = await this.getAnnotationsForExport(userId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Title
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('My Annotations', { align: 'center' });

      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Exported on ${new Date().toLocaleDateString()}`, {
        align: 'center',
      });

      doc.moveDown(2);

      // Group by content
      const grouped = this.groupByContent(annotations);

      Object.entries(grouped).forEach(([contentTitle, annots]: [string, any[]]) => {
        // Content title
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#333')
          .text(contentTitle);

        doc.moveDown(0.5);

        // Annotations
        annots.forEach((annotation, index) => {
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#666')
            .text(`${index + 1}. ${new Date(annotation.createdAt).toLocaleDateString()}`);

          if (annotation.selectedText) {
            doc
              .fontSize(11)
              .font('Helvetica-Oblique')
              .fillColor('#444')
              .text(`"${annotation.selectedText}"`, { indent: 20 });
          }

          if (annotation.text) {
            doc
              .fontSize(10)
              .font('Helvetica')
              .fillColor('#000')
              .text(annotation.text, { indent: 20 });
          }

          doc.moveDown(0.5);
        });

        doc.moveDown();
      });

      doc.end();
    });
  }

  /**
   * Export annotations to Markdown
   */
  async exportToMarkdown(userId: string): Promise<string> {
    const annotations = await this.getAnnotationsForExport(userId);

    let markdown = '# My Annotations\n\n';
    markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;
    markdown += '---\n\n';

    // Group by content
    const grouped = this.groupByContent(annotations);

    Object.entries(grouped).forEach(([contentTitle, annots]: [string, any[]]) => {
      markdown += `## ${contentTitle}\n\n`;

      annots.forEach((annotation, index) => {
        markdown += `### ${index + 1}. ${new Date(annotation.createdAt).toLocaleDateString()}\n\n`;

        if (annotation.selectedText) {
          markdown += `> ${annotation.selectedText}\n\n`;
        }

        if (annotation.text) {
          markdown += `**Note:** ${annotation.text}\n\n`;
        }

        if (annotation.color) {
          markdown += `*Color: ${annotation.color}*\n\n`;
        }

        markdown += '---\n\n';
      });
    });

    return markdown;
  }

  /**
   * Get annotations for export
   */
  private async getAnnotationsForExport(userId: string) {
    return this.prisma.annotation.findMany({
      where: { userId },
      include: {
        content: {
          select: { title: true },
        },
        user: {
          select: { name: true },
        },
      },
      orderBy: [{ content: { title: 'asc' } }, { createdAt: 'asc' }],
    });
  }

  /**
   * Group annotations by content
   */
  private groupByContent(annotations: any[]): Record<string, any[]> {
    return annotations.reduce((acc, annotation) => {
      const title = annotation.content.title;
      if (!acc[title]) {
        acc[title] = [];
      }
      acc[title].push(annotation);
      return acc;
    }, {});
  }
}
