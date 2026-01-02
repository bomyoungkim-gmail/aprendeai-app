import amqp from "amqplib";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const prisma = new PrismaClient();
const QUEUE = "content.extract";

interface ExtractionMessage {
  action: "EXTRACT_TEXT";
  contentId: string;
  timestamp: string;
}

interface ChunkData {
  chunkIndex: number;
  text: string;
  pageNumber?: number;
  tokenEstimate?: number;
}

async function processExtraction(payload: ExtractionMessage) {
  const { contentId } = payload;
  console.log(`[*] Processing extraction for content: ${contentId}`);

  try {
    // 1. Update status to RUNNING
    await prisma.content_extractions.update({
      where: { content_id: contentId }, // Check if field is contentId or content_id. Schema says content_id.
      // Schema line 341: content_id String @unique
      // Code used where: { contentId }. If implicit, it matches variable name.
      // BUT schema field name is content_id.
      // So { content_id: contentId } is needed if variable is contentId.
      data: { status: "RUNNING", updated_at: new Date() }, // Schema updated_at
    });

    // 2. Get content with file info
    const content = await prisma.contents.findUnique({
      where: { id: contentId },
      include: { files: true }, // Schema Relation is `files`. Line 435: files files?
    });

    if (!content) {
      throw new Error("Content not found");
    }

    if (!content.files) {
      throw new Error("Content has no file attached");
    }

    // 3. Extract text based on content type
    let text = "";
    let metadata: any = {};

    console.log(`[*] Extracting from ${content.type}`);

    if (content.type === "PDF") {
      ({ text, metadata } = await extractFromPDF(content.files));
    } else if (content.type === "DOCX") {
      ({ text, metadata } = await extractFromDOCX(content.files));
    } else if (content.type === "IMAGE") {
      ({ text, metadata } = await extractFromImage(content.files));
    } else {
      throw new Error(`Unsupported content type: ${content.type}`);
    }

    console.log(`[*] Extracted ${text.length} characters`);

    // 4. Generate chunks
    const chunks = generateChunks(content.type, text, metadata);
    console.log(`[*] Generated ${chunks.length} chunks`);

    // 5. Save chunks to database
    await saveChunks(contentId, chunks);

    // 6. Update extraction to DONE
    await prisma.content_extractions.update({
      where: { content_id: contentId },
      data: {
        status: "DONE",
        metadata_json: metadata,
        updated_at: new Date(),
      },
    });

    console.log(`[✓] Extraction completed for content: ${contentId}`);
  } catch (error) {
    console.error(`[✗] Extraction failed for content: ${contentId}`, error);

    // Update to FAILED with error info
    await prisma.content_extractions.update({
      where: { content_id: contentId },
      data: {
        status: "FAILED",
        metadata_json: {
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
        updated_at: new Date(),
      },
    });
  }
}

async function extractFromPDF(
  file: any
): Promise<{ text: string; metadata: any }> {
  // For now, use mock file path (in production, download from S3)
  const mockFilePath = path.join(
    process.env.STORAGE_LOCAL_PATH || "./uploads",
    file.storageKey || "mock.pdf"
  );

  // Check if file exists
  if (!fs.existsSync(mockFilePath)) {
    console.warn(`[!] PDF file not found at ${mockFilePath}, using stub`);
    return {
      text: "",
      metadata: {
        message: "File not found - needs storage integration",
        pages: 0,
        hasTextLayer: false,
      },
    };
  }

  try {
    const dataBuffer = fs.readFileSync(mockFilePath);
    const data = await pdfParse(dataBuffer);

    const hasText = data.text.trim().length > 0;

    return {
      text: data.text,
      metadata: {
        pages: data.numpages,
        hasTextLayer: hasText,
        needsOCR: !hasText,
        extractionMethod: "pdf-parse",
      },
    };
  } catch (error) {
    return {
      text: "",
      metadata: {
        error: error instanceof Error ? error.message : "PDF parsing failed",
        extractionMethod: "pdf-parse",
      },
    };
  }
}

async function extractFromDOCX(
  file: any
): Promise<{ text: string; metadata: any }> {
  const mockFilePath = path.join(
    process.env.STORAGE_LOCAL_PATH || "./uploads",
    file.storageKey || "mock.docx"
  );

  if (!fs.existsSync(mockFilePath)) {
    console.warn(`[!] DOCX file not found at ${mockFilePath}, using stub`);
    return {
      text: "",
      metadata: {
        message: "File not found - needs storage integration",
      },
    };
  }

  try {
    const result = await mammoth.extractRawText({ path: mockFilePath });

    return {
      text: result.value,
      metadata: {
        warnings: result.messages,
        extractionMethod: "mammoth",
      },
    };
  } catch (error) {
    return {
      text: "",
      metadata: {
        error: error instanceof Error ? error.message : "DOCX parsing failed",
        extractionMethod: "mammoth",
      },
    };
  }
}

async function extractFromImage(
  file: any
): Promise<{ text: string; metadata: any }> {
  const ocrEnabled = process.env.OCR_ENABLED === "true";

  if (!ocrEnabled) {
    return {
      text: "",
      metadata: {
        message: "OCR required but disabled",
        ocrEnabled: false,
      },
    };
  }

  // TODO: Implement OCR (Tesseract, Google Vision, etc)
  return {
    text: "",
    metadata: {
      message: "OCR not implemented yet",
      ocrEnabled: true,
      ocrProvider: process.env.OCR_PROVIDER || "NONE",
    },
  };
}

function generateChunks(
  contentType: string,
  text: string,
  metadata: any
): ChunkData[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: ChunkData[] = [];

  if (contentType === "PDF") {
    // Chunk by size (simple strategy)
    const chunkSize = 800; // ~200 tokens
    let index = 0;

    for (let i = 0; i < text.length; i += chunkSize) {
      const chunkText = text.substring(i, i + chunkSize).trim();
      if (chunkText.length > 0) {
        chunks.push({
          chunkIndex: index++,
          text: chunkText,
          tokenEstimate: Math.ceil(chunkText.length / 4),
          pageNumber: undefined, // TODO: Map to actual pages
        });
      }
    }
  } else if (contentType === "DOCX") {
    // Chunk by paragraphs
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

    paragraphs.forEach((para, index) => {
      chunks.push({
        chunkIndex: index,
        text: para.trim(),
        tokenEstimate: Math.ceil(para.length / 4),
      });
    });
  } else {
    // Single chunk for IMAGE
    chunks.push({
      chunkIndex: 0,
      text: text.trim(),
      tokenEstimate: Math.ceil(text.length / 4),
    });
  }

  return chunks;
}

async function saveChunks(contentId: string, chunks: ChunkData[]) {
  // Delete existing chunks
  await prisma.content_chunks.deleteMany({
    where: { content_id: contentId },
  });

  // Insert new chunks in batches
  const batchSize = 100;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    await prisma.content_chunks.createMany({
      data: batch.map((chunk) => ({
        content_id: contentId,
        chunk_index: chunk.chunkIndex,
        text: chunk.text,
        page_number: chunk.pageNumber,
        token_estimate: chunk.tokenEstimate,
      })),
    });
  }
}

async function start() {
  const rabbitUrl =
    process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

  console.log("[*] Extraction Worker starting...");
  console.log(`[*] Connecting to RabbitMQ: ${rabbitUrl}`);

  let connection;
  try {
    connection = await amqp.connect(rabbitUrl);
  } catch (err) {
    console.error("[✗] Failed to connect to RabbitMQ, retrying in 5s...", err);
    setTimeout(start, 5000);
    return;
  }

  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.prefetch(1); // Process one job at a time

  console.log(`[*] Extraction Worker waiting for messages in ${QUEUE}`);

  channel.consume(QUEUE, async (msg) => {
    if (msg !== null) {
      const content = msg.content.toString();
      console.log(`[x] Received job: ${content}`);

      try {
        const task: ExtractionMessage = JSON.parse(content);

        if (task.action === "EXTRACT_TEXT") {
          await processExtraction(task);
        } else {
          console.warn(`[!] Unknown action: ${task.action}`);
        }
      } catch (err) {
        console.error("[✗] Error processing job", err);
      }

      channel.ack(msg);
    }
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n[*] Shutting down gracefully...");
    await channel.close();
    await connection.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}

start();
