// @ts-nocheck - disable type checking for this worker
const amqp = require('amqplib');
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const QUEUE = 'content.process';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai:8001';
const API_URL = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('postgres://', 'http://api:4000/api/v1') : 'http://localhost:4000/api/v1';

async function start() {
  const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  
  let connection;
  try {
    connection = await amqp.connect(rabbitUrl);
  } catch (err) {
    console.error("Failed to connect to RabbitMQ, retrying in 5s...", err);
    setTimeout(start, 5000);
    return;
  }

  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });
  console.log(`[*] Content Processor waiting for messages in ${QUEUE}.`);

  channel.consume(QUEUE, async (msg: any) => {
    if (msg !== null) {
      const contentStr = msg.content.toString();
      console.log(`[x] Received Task: ${contentStr}`);
      
      try {
        const task = JSON.parse(contentStr);
        // Task Schema: { action: 'SIMPLIFY' | 'ASSESSMENT', contentId: string, text: string, ...params }

        if (task.action === 'SIMPLIFY') {
            console.log("Calling AI Simplify...");
            const aiRes = await axios.post(`${AI_SERVICE_URL}/simplify`, {
                text: task.text,
                source_lang: task.sourceLang || 'PT_BR',
                target_lang: task.targetLang || 'PT_BR',
                schooling_level: task.level || '5_EF'
            });
            
            const result = aiRes.data; // { simplified_text, summary, glossary }
            
            // Save as ContentVersion
            await axios.post(`${API_URL}/content/${task.contentId}/versions`, {
                targetLanguage: task.targetLang || 'PT_BR',
                schoolingLevelTarget: task.level || '5_EF',
                simplifiedText: result.simplified_text,
                summary: result.summary,
                vocabularyGlossary: result.glossary
            });
            console.log("Saved simplified version.");

        } else if (task.action === 'ASSESSMENT') {
            console.log("Calling AI Assessment...");
            const aiRes = await axios.post(`${AI_SERVICE_URL}/generate-assessment`, {
                text: task.text,
                schooling_level: task.level || '1_EM',
                num_questions: 5
            });

            const result = aiRes.data; // { questions: [...] }
            
            // Transform to API DTO
            const questionsDto = result.questions.map((q: any) => ({
                questionType: 'MULTIPLE_CHOICE', // AI currently hardcoded to multiple choice in my stub
                questionText: q.question_text,
                options: q.options,
                correctAnswer: q.correct_answer_index
            }));

            // Save Assessment
            await axios.post(`${API_URL}/assessment`, {
                contentId: task.contentId,
                schoolingLevelTarget: task.level || '1_EM',
                questions: questionsDto
            });
            console.log("Saved assessment.");
        }

      } catch (err) {
        console.error("Error processing task", err instanceof Error ? err.message : err);
      }

      channel.ack(msg);
    }
  });
}

start();
