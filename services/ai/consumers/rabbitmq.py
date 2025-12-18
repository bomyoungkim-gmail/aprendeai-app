"""
RabbitMQ Consumer for asset generation jobs
Listens to 'assets.generate' queue and processes generation requests
"""
import pika
import json
import asyncio
import os
import traceback
from asset_generator import generate_asset, persist_asset


def start_consumer():
    """
    Start RabbitMQ consumer for asset generation.
    Connects to RabbitMQ and listens for generation jobs.
    """
    rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
    rabbitmq_url = os.getenv('RABBITMQ_URL', f'amqp://guest:guest@{rabbitmq_host}:5672')
    
    print(f"[CONSUMER] Connecting to RabbitMQ at {rabbitmq_url}")
    
    try:
        # Parse URL if provided
        if rabbitmq_url.startswith('amqp://'):
            connection = pika.BlockingConnection(
                pika.URLParameters(rabbitmq_url)
            )
        else:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=rabbitmq_host)
            )
        
        channel = connection.channel()
        
        # Declare queue (idempotent)
        channel.queue_declare(queue='assets.generate', durable=True)
        
        print("[CONSUMER] Connected successfully")
        
    except Exception as e:
        print(f"[CONSUMER] Failed to connect to RabbitMQ: {e}")
        print("[CONSUMER] Make sure RabbitMQ is running")
        return
    
    def callback(ch, method, properties, body):
        """
        Process asset generation message.
        
        Message format:
        {
            "jobId": "uuid",
            "userId": "uuid",
            "contentId": "uuid",
            "layer": "L1|L2|L3",
            "educationLevel": "string",
            "modality": "READING|LISTENING|WRITING",
            "selectedHighlightIds": ["uuid", ...],
            "promptVersion": "v1.0",
            "timestamp": "ISO timestamp"
        }
        """
        try:
            message = json.loads(body)
            job_id = message.get('jobId')
            
            print(f"\n{'='*60}")
            print(f"[JOB {job_id}] Processing asset generation")
            print(f"[JOB {job_id}] Content: {message.get('contentId')}")
            print(f"[JOB {job_id}] Layer: {message.get('layer')}")
            print(f"[JOB {job_id}] Education Level: {message.get('educationLevel')}")
            print(f"{'='*60}\n")
            
            # Run async generation
            asset = asyncio.run(generate_asset(
                content_id=message['contentId'],
                layer=message['layer'],
                education_level=message['educationLevel'],
                modality=message['modality'],
                prompt_version=message.get('promptVersion', 'v1.0'),
                selected_highlight_ids=message.get('selectedHighlightIds')
            ))
            
            # Persist to database
            asset_id = asyncio.run(persist_asset(
                content_id=message['contentId'],
                modality=message['modality'],
                asset=asset
            ))
            
            # Acknowledge message
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
            print(f"\n[JOB {job_id}] ✅ Completed successfully")
            print(f"[JOB {job_id}] Asset ID: {asset_id}")
            print(f"[JOB {job_id}] Target words: {len(asset.target_words)}")
            print(f"[JOB {job_id}] Glossary entries: {len(asset.glossary)}")
            print(f"[JOB {job_id}] Cues: {len(asset.cues)}")
            print(f"[JOB {job_id}] Checkpoints: {len(asset.checkpoints)}")
            print(f"[JOB {job_id}] Quiz questions: {len(asset.quiz_post)}\n")
            
        except Exception as e:
            print(f"\n[JOB {job_id}] ❌ Error processing message: {e}")
            print(traceback.format_exc())
            
            # Reject message (don't requeue by default to avoid infinite loops)
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            
            print(f"[JOB {job_id}] Message rejected\n")
    
    # Configure consumer
    channel.basic_qos(prefetch_count=1)  # Process one message at a time
    channel.basic_consume(
        queue='assets.generate',
        on_message_callback=callback,
        auto_ack=False  # Manual acknowledgment
    )
    
    print("[CONSUMER] Waiting for asset generation jobs...")
    print("[CONSUMER] Press CTRL+C to exit\n")
    
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("\n[CONSUMER] Shutting down...")
        channel.stop_consuming()
    finally:
        connection.close()
        print("[CONSUMER] Connection closed")


if __name__ == "__main__":
    start_consumer()
