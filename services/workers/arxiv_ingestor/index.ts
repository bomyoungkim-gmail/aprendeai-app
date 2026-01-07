import amqp, { ConsumeMessage } from 'amqplib';
import dotenv from 'dotenv';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

// Phase 1: Use env vars instead of shared config
const API_URL = process.env.API_URL || 'http://api:4000/api/v1';

dotenv.config();

const QUEUE = 'arxiv.fetch';

type CreateContentDto = {
  title: string;
  type: 'ARXIV';
  originalLanguage: 'EN'; // Arxiv is mostly EN
  rawText: string;
  sourceId: string;
  metadata: any;
};

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
  
  console.log(`[*] Arxiv Ingestor waiting for messages in ${QUEUE}.`);

  channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
    if (msg !== null) {
      const content = msg.content.toString();
      console.log(`[x] Received Task: ${content}`);
      
      try {
        const { query, max_results } = JSON.parse(content);
        const searchQuery = query || 'cat:cs.AI';
        const limit = max_results || 5;

        console.log(`Searching Arxiv for: ${searchQuery}...`);
        
        const response = await axios.get(`http://export.arxiv.org/api/query?search_query=${searchQuery}&start=0&max_results=${limit}`);
        const result = await parseStringPromise(response.data);
        
        if (!result.feed.entry) {
            console.log("No entries found.");
            channel.ack(msg);
            return;
        }

        for (const entry of result.feed.entry) {
            const title = entry.title[0].replace(/\n/g, ' ').trim();
            const summary = entry.summary[0].trim();
            const id = entry.id[0];
            const authors = entry.author.map((a: any) => a.name[0]);
            
            const payload: CreateContentDto = {
                title: title,
                type: 'ARXIV',
                originalLanguage: 'EN',
                rawText: summary, // Storing summary as rawText for now
                sourceId: id,
                metadata: {
                    authors,
                    published: entry.published[0],
                    link: id
                }
            };
            
             // Post to API with service-to-service auth
             try {
                await axios.post(`${API_URL}/contents`, payload, {
                   headers: { 'x-api-key': process.env.API_SERVICE_SECRET || '' }
                });
                console.log(`saved: ${title}`);
             } catch (apiErr) {
                console.error(`Failed to save content: ${title}`, apiErr instanceof Error ? apiErr.message : apiErr);
             }
        }

      } catch (err) {
        console.error("Error processing message", err);
      }
      
      channel.ack(msg);
    }
  });
}

start();
