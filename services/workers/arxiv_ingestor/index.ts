import amqp from 'amqplib';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const QUEUE = 'arxiv.fetch';

async function start() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
  const channel = await connection.createChannel();
  
  await channel.assertQueue(QUEUE, { durable: true });
  console.log(`[*] Waiting for messages in ${QUEUE}.`);

  channel.consume(QUEUE, async (msg) => {
    if (msg !== null) {
      console.log(`[x] Received ${msg.content.toString()}`);
      // TODO: Fetch arXiv logic
      channel.ack(msg);
    }
  });
}

start().catch(console.error);
