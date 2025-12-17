import amqp from 'amqplib';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const QUEUE = 'content.process';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function start() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
  const channel = await connection.createChannel();
  
  await channel.assertQueue(QUEUE, { durable: true });
  console.log(`[*] Waiting for messages in ${QUEUE}.`);

  channel.consume(QUEUE, async (msg) => {
    if (msg !== null) {
      console.log(`[x] Received processing task`);
      // TODO: Call AI Service logic
      // const response = await axios.post(`${AI_SERVICE_URL}/simplify`, { ... });
      channel.ack(msg);
    }
  });
}

start().catch(console.error);
