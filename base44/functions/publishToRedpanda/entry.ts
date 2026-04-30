/**
 * Publishes normalized UDM events to Redpanda message bus.
 * 
 * Required secrets:
 * - REDPANDA_BROKERS: comma-separated list (e.g., "localhost:9092,localhost:9093")
 * - REDPANDA_TOPIC_UDM: topic name (e.g., "udm_raw")
 * - REDPANDA_SASL_USER (optional): SASL username
 * - REDPANDA_SASL_PASSWORD (optional): SASL password
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Kafka } from 'npm:kafkajs@2.2.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { udm_event } = await req.json();

    if (!udm_event) {
      return Response.json({ error: 'Missing udm_event' }, { status: 400 });
    }

    // Read Redpanda config from secrets
    const brokers = (Deno.env.get('REDPANDA_BROKERS') || 'localhost:9092').split(',');
    const topic = Deno.env.get('REDPANDA_TOPIC_UDM') || 'udm_raw';
    const saslUser = Deno.env.get('REDPANDA_SASL_USER');
    const saslPassword = Deno.env.get('REDPANDA_SASL_PASSWORD');

    // Initialize Kafka client
    const kafka = new Kafka({
      clientId: 'b44-udm-producer',
      brokers,
      ...(saslUser && saslPassword && {
        sasl: {
          mechanism: 'plain',
          username: saslUser,
          password: saslPassword,
        },
      }),
      ssl: true,
    });

    const producer = kafka.producer();
    await producer.connect();

    // Publish the UDM event
    const result = await producer.send({
      topic,
      messages: [
        {
          key: udm_event.event_id || 'default',
          value: JSON.stringify(udm_event),
          timestamp: Date.now().toString(),
        },
      ],
    });

    await producer.disconnect();

    return Response.json({
      success: true,
      event_id: udm_event.event_id,
      topic,
      partition: result[0].partition,
      offset: result[0].topicPartitionResponse[0].offset,
    });
  } catch (error) {
    console.error('Redpanda publish error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});