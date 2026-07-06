# 📱 UCE Library - Mobile Notification Center (React Native App)

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

The **Mobile Notification Center** is the official mobile application of **UCE Library** for **iOS and Android** devices. Developed with **React Native and the Expo SDK**, it allows the university community and administrative personnel to receive real-time institutional alerts regarding loans, returns, due dates, and monetary fines.

---

## 🏛️ Role in the Distributed Ecosystem

While the web portal and desktop kiosk are designed for catalog consultation and circulation management, the mobile app is optimized for **push communication and pocket monitoring**:
1. **For Students:** Receive instant confirmations upon borrowing a book (`LOAN_CREATED`), reminders prior to the due date, and alerts whenever monetary penalties occur (`FINE_CREATED`).
2. **For Administrators:** Logging in with administrative credentials (`qa.tester@uce.edu.ec`) automatically switches the app to the global institutional channel (`ADMIN_NOTIFICATIONS`), enabling live monitoring of campus borrowing activity from their mobile devices.

---

## 🏛️ Architecture & Real-Time Synchronization

The application is engineered for high resilience and low battery consumption:
- **Intelligent Polling & Pull-to-Refresh:** Implements optimized periodic polling every 10 seconds against the **API Gateway (`/api/notifications/user/*`)** to reflect events emitted by Kafka and RabbitMQ, alongside native pull-to-refresh gestures.
- **Client-Side Dynamic Filtering:** Instant categorization across navigation tabs (*All*, *Unread*, and *Read*) with live badge counter calculations.
- **Native Design & Dark Mode:** Built on `SafeAreaView`, `KeyboardAvoidingView`, and native iOS/Android components styled with an institutional Slate/Indigo color palette.

---

## 🗺️ Project Structure

```
apps/mobile/
├── assets/             # Institutional icons, splash screens, and logos
├── App.js              # Core logic for authentication, polling, filtering, and rendering
├── app.json            # Native configuration for Expo / Android / iOS compilers
└── package.json        # React Native dependencies and mobile libraries
```

---

## 🚀 Key Features

1. **Secure Institutional Authentication:** Login integrated with the `auth-service` via JWT tokens with in-memory session persistence.
2. **Multimedia Alert Center:** Differentiated visual cards featuring distinct iconography depending on the library event (📖 *Loan*, ✅ *Return*, ⚠️ *Fine*, 🎯 *Reservation*).
3. **Dynamic Server Configuration (Kiosk / QA):** Hidden collapsible panel allowing users to point the application to local servers or the AWS ALB in QA (`https://kleberchiliquingaqa1.distribuidauce.org`).
4. **Bulk Read Marking:** *✓ Mark All Read* button that synchronizes read status across the distributed notification database.

---

## 🛠️ How to Run Locally

### 1. Prerequisites
Install the **Expo Go** application on your physical iOS/Android device or configure an emulator (Android Studio / Xcode Simulator).

### 2. Installation & Execution
```bash
# Enter the mobile app directory
cd apps/mobile

# Install React Native dependencies
npm install

# Start development server with Expo Metro Bundler
npx expo start
# or via npm
npm run start
```

### 3. Device Testing
- Scan the **QR Code** displayed in the terminal using your iPhone camera or the Expo Go app on Android.
- **QA Test Credentials:** You can log in with the administrator account `qa.tester@uce.edu.ec` / `TestSeguro2026` or any student account.

---
## 👨‍💻 Author & Developer

**Kleber Alejandro Chiliquinga Lara**  
*Course: Distributed Programming*  
Universidad Central del Ecuador (UCE)

---
*📚 UCE Library Distributed System - 2026*
