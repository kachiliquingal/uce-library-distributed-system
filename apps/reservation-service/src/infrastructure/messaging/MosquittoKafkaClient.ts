import mqtt from 'mqtt';
import { Kafka, Producer } from 'kafkajs';
import { IMessageBroker } from '../../domain/IMessageBroker';
import { logger } from '../../utils/logger';

export class MosquittoKafkaClient implements IMessageBroker {
  private mqttClient?: mqtt.MqttClient;
  private kafkaProducer?: Producer;
  private isMqttConnected = false;
  private isKafkaConnected = false;

  constructor() {
    this.initMqtt();
    this.initKafka();
  }

  private initMqtt() {
    try {
      const brokerUrl = process.env.MQTT_BROKER_URL || `mqtt://${process.env.BROKERS_IP || 'localhost'}:1883`;
      this.mqttClient = mqtt.connect(brokerUrl, {
        reconnectPeriod: 5000,
        connectTimeout: 5000
      });

      this.mqttClient.on('connect', () => {
        this.isMqttConnected = true;
        logger.info(`✅ Conectado exitosamente a bróker MQTT Mosquitto en ${brokerUrl}`);
      });

      this.mqttClient.on('error', (err) => {
        this.isMqttConnected = false;
        logger.debug('⚠️ Bróker MQTT no accesible temporalmente (simulación offline/local activo): ' + err.message);
      });
    } catch {
      logger.warn('⚠️ No se pudo inicializar cliente MQTT Mosquitto');
    }
  }

  private async initKafka() {
    try {
      const brokerIp = process.env.BROKERS_IP || 'localhost';
      const kafka = new Kafka({
        clientId: 'reservation-service',
        brokers: [`${brokerIp}:9092`],
        retry: { retries: 2 }
      });
      this.kafkaProducer = kafka.producer();
      await this.kafkaProducer.connect();
      this.isKafkaConnected = true;
      logger.info(`✅ Conectado exitosamente a Kafka en ${brokerIp}:9092`);
    } catch {
      this.isKafkaConnected = false;
      logger.debug('⚠️ Kafka no accesible temporalmente (modo resiliencia local activo)');
    }
  }

  async publishMqtt(topic: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.mqttClient || !this.isMqttConnected) {
      logger.debug(`[MQTT Fallback] Tópico: ${topic} | Payload: ${JSON.stringify(payload)}`);
      return;
    }
    return new Promise((resolve) => {
      this.mqttClient!.publish(topic, JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
        if (err) logger.warn(`Error publicando en MQTT ${topic}: ${err.message}`);
        else logger.info(`📡 [MQTT Publicado] Tópico: ${topic}`);
        resolve();
      });
    });
  }

  async publishKafka(topic: string, event: Record<string, unknown>): Promise<void> {
    if (!this.kafkaProducer || !this.isKafkaConnected) {
      logger.debug(`[Kafka Fallback] Tópico: ${topic} | Evento: ${JSON.stringify(event)}`);
      return;
    }
    try {
      await this.kafkaProducer.send({
        topic,
        messages: [{ value: JSON.stringify(event) }]
      });
      logger.info(`📨 [Kafka Publicado] Tópico: ${topic}`);
    } catch {
      logger.warn(`Error publicando en Kafka ${topic}`);
    }
  }
}
