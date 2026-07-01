import mqtt from 'mqtt';
import { logger } from '../../utils/logger';

export class MqttPublisher {
  private static client: mqtt.MqttClient;

  public static connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Connect to Mosquitto (port 1883 for backend-backend MQTT)
      const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://mosquitto:1883';
      
      this.client = mqtt.connect(brokerUrl);

      this.client.on('connect', () => {
        logger.info(`[MQTT] Connected to broker at ${brokerUrl}`);
        resolve();
      });

      this.client.on('error', (error) => {
        logger.error('[MQTT] Connection error:', error);
        reject(error);
      });
    });
  }

  public static publishNotification(userId: string, notification: any): void {
    if (!this.client || !this.client.connected) {
      logger.error('[MQTT] Cannot publish, client is not connected');
      return;
    }

    const topic = `notifications/${userId}`;
    const payload = JSON.stringify(notification);

    this.client.publish(topic, payload, { qos: 1 }, (error) => {
      if (error) {
        logger.error(`[MQTT] Failed to publish to topic ${topic}:`, error);
      } else {
        logger.info(`[MQTT] Successfully published notification to ${topic}`);
      }
    });
  }
}
