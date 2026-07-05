export interface IMessageBroker {
  publishMqtt(topic: string, payload: Record<string, unknown>): Promise<void>;
  publishKafka(topic: string, event: Record<string, unknown>): Promise<void>;
}
