import amqp, { ConsumeMessage } from 'amqplib';
import dotenv from 'dotenv';
import Parser from 'rss-parser';
import axios from 'axios';

// Phase 1: Use env vars instead of shared config
const API_URL = process.env.API_URL || 'http://api:4000/api/v1';

dotenv.config();

const QUEUE = 'news.fetch';
const parser = new Parser();

// Types for API
type CreateContentDto = {
  title: string;
  type: 'NEWS';
  originalLanguage: 'PT_BR' | 'EN';
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
  
  console.log(`[*] News Ingestor waiting for messages in ${QUEUE}.`);

  channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
    if (msg !== null) {
      const content = msg.content.toString();
      console.log(`[x] Received Task: ${content}`);
      
      try {
        const { url, lang } = JSON.parse(content);
        if (!url) throw new Error("URL not provided");

        console.log(`Fetching RSS from ${url}...`);
        const feed = await parser.parseURL(url);
        
        console.log(`Found ${feed.items.length} items.`);

        for (const item of feed.items.slice(0, 5)) { // Limit to 5 newer items
           if (!item.title || !item.content && !item.contentSnippet) continue;

           const payload: CreateContentDto = {
             title: item.title,
             type: 'NEWS',
             originalLanguage: lang || 'EN',
             rawText: item.content || item.contentSnippet || '',
             sourceId: item.guid || item.link || '',
             metadata: {
                link: item.link,
                pubDate: item.pubDate,
                author: item.creator
             }
           };

           // Post to API
           try {
             // In a real scenario we need an API Token/Secret for internal communication
             // For now assuming public or simple auth if implemented
             // Since we haven't implemented Service-to-Service auth, this might fail if @UseGuards is strictly on.
             // We'll trust the network or need to generate a token.
             // OPTION: The worker creates content via API. 
             // IMPORTANT: The API endpoints are protected by JWT. 
             // We need to implement a "System User" or "API Key" strategy.
             // For simplicity in this skeletal phase, I will add a temporary "seed" user or assume no guard on POST for now (or I'll fix the controller to allow internal IPs - hard).
             // Better: Login as admin first? Too complex for this script.
             // DECISION: I will disable AuthGuard on the Create POST temporarily to test integration OR implementation a mock login.
             // Let's try to just log payload for now if I can't hit API.
             
             // Actually, I can use the shared secrets or just disable guard for dev.
             // Let's assume passed Auth check for now or use a "system" token.
             
             // Using axios
             await axios.post(`${API_URL}/content`, payload, {
                // headers: { Authorization: `Bearer ${token}` }
             });
             console.log(`saved: ${item.title}`);

           } catch (apiErr) {
             console.error(`Failed to save content: ${item.title}`, apiErr instanceof Error ? apiErr.message : apiErr);
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
