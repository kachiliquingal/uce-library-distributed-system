# 🔔 MS-03: Notification Service (Real-Time Notifications Microservice)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)
![MQTT](https://img.shields.io/badge/MQTT-3C5280?style=for-the-badge&logo=mqtt&logoColor=white)

The **Notification Service (MS-03)** is the asynchronous communication and real-time alert engine of **UCE Library**. Built on **Node.js, TypeScript, and MongoDB**, it acts as a multi-protocol messaging hub that listens to events from **Apache Kafka** and **RabbitMQ**, broadcasting instant alerts via **MQTT WebSockets** and HTTP APIs.

---

## 🏛️ Why MongoDB (High Write-Throughput NoSQL)

Institutional alerts and mobile notifications are generated at an extremely high frequency:
- Every loan checkout, return, reservation, late fine, or administrative login triggers a record that must be stored instantly without blocking primary database transactions.
- **MongoDB** provides write throughput far exceeding traditional relational databases, enabling indexing by user ID, read status (`SENT`, `READ`), and creation timestamp (`createdAt`) for ultra-fast mobile app queries.

---

## 🏛️ Multi-Protocol Architecture (Kafka + RabbitMQ + MQTT)

```
src/
├── domain/             # NotificationModel (Mongo Schema)
├── infrastructure/     # Messaging adapters and routes
│   ├── messaging/      # KafkaConsumer (Topics: book.borrowed, book.returned)
│   ├── rabbitmq/       # RabbitMQConsumer (Queues: fine.trigger, reservation.ready)
│   ├── mqtt/           # MqttBroker (Aedes server for IoT/Mobile WebSockets on port 9001)
│   └── http/           # Express routes and controllers
└── index.ts            # Global initialization
```

### 1. Event Consumption (Kafka & RabbitMQ)
- **Apache Kafka:** Listens to high-throughput catalog and circulation events (`book.borrowed`, `book.returned`) emitted by `loan-service`.
- **RabbitMQ:** Processes specialized background queue tasks and critical financial triggers (`fine.trigger`) emitted by `fine-service`.

### 2. Real-Time Broadcasting (MQTT WebSockets)
In addition to database persistence for mobile polling, the microservice integrates an MQTT broker (**Aedes**) that broadcasts live telemetry over WebSockets (`/mqtt`), allowing IoT terminals, library displays, and web dashboards to receive instant push alerts without polling.

---

## 🚀 Key Features

1. **Unified Alert Inbox:** Stores the complete message history directed to individual students or the global administrative channel (`ADMIN_NOTIFICATIONS`).
2. **Read Status Management:** Allows marking individual or bulk notifications as read (`READ`), synchronizing across all student platforms.
3. **Fault Tolerance & Persistence:** If a student is disconnected from the mobile app, alerts are safely preserved in MongoDB until their next login.
4. **Swagger / OpenAPI Documentation:** Available for testing at `/api-docs`.

---

## 🔌 Main Endpoints

| Method | Endpoint | Description | Parameters / Request Body |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/notifications/user/:userId` | Get all alerts for a user or admin channel | Path param: `userId` |
| `PUT` | `/api/notifications/user/:userId/read` | Mark all user alerts as read | Path param: `userId` |
| `PUT` | `/api/notifications/:id/read` | Mark a specific notification as read | Path param: `id` |
| `GET` | `/health` | Microservice health check endpoint for AWS | N/A |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `apps/notification-service`:

```ini
PORT=3005
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/uce_library_notifications
KAFKA_BROKERS=localhost:9092
RABBITMQ_URL=amqp://localhost:5672
MQTT_PORT=1883
MQTT_WS_PORT=9001
```

---

## 🛠️ How to Run Locally

### 1. Installation & Execution
```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build and start for production
npm run build
npm start
```

### 2. Unit Testing
The service includes automated tests to verify NoSQL schemas and queue handling:
```bash
npm test
```

---
## 👨‍💻 Author & Developer

**Kleber Alejandro Chiliquinga Lara**  
*Course: Distributed Programming*  
Universidad Central del Ecuador (UCE)

---
*📚 UCE Library Distributed System - 2026*
