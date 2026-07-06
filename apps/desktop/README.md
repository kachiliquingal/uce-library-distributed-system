# 🖥️ UCE Library - Digital Station & Librarian Desktop Terminal (Desktop App)

![Electron](https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

The **Digital Station & Librarian Desktop Terminal** is a native desktop application built on **Electron**. It is specifically designed to operate as a **Fast Counter Service Point** for librarians and administrators, as well as a **Self-Service Digital Consultation Station** for students in reading rooms across Universidad Central del Ecuador.

---

## 🏛️ Role in the Distributed Ecosystem

Unlike the administrative web application (which handles heavy administrative tasks such as user onboarding, photo uploads, credit card payments, and PDF reports), the desktop application focuses on speed, simplicity, and uninterrupted operation:
1. **For Administrators & Librarians:** Operates as a fast counter terminal, allowing live monitoring of the university's 44+ active loans and fines across the system in real time.
2. **For Students:** Acts as an ultra-fast digital catalog where students can check book availability and real physical shelf stock without distractions.

---

## ⚡ Architecture & Asynchronous Communication

The interface is built with **Vanilla JavaScript and Modern CSS (Dark Mode)** to guarantee instant rendering performance without heavy framework overhead:
- **Intelligent Hybrid Fetching:** The renderer executes combined asynchronous queries (`Promise.all`), connecting to the `catalog-service` for bibliographic metadata and to the `inventory-service` for real physical copy counts on shelves (`availableCopies`).
- **Role-Based Adaptability:** If the JWT token belongs to an Administrator (`role === 'ADMIN'`), the loans tab automatically queries the global endpoint `/api/loans/?activeOnly=false` and `/api/fines/`. If it belongs to a student, it queries only their personal borrowing history `/api/loans/user/{id}`.

---

## 🗺️ Project Structure

```
apps/desktop/
├── main.js             # Electron main process (window configuration and security)
├── renderer.js         # Presentation logic, API Gateway consumption, and DOM management
├── index.html          # Semantic HTML structure with 3 core navigation tabs
├── styles.css          # Avant-garde Dark Mode styling, Glassmorphism, and animations
└── package.json        # Native packaging configuration and scripts
```

---

## 🚀 Key Features

1. **Real-Time Digital Catalog:** Instant search by keyword, title, or author, reflecting dynamic shelf stock badges (*✔ Available vs Out of Stock*).
2. **Loan & Return Monitoring:** Clear table displaying formatted hash codes (`#4ae0f3e...`), due dates, and UCE status badges.
3. **Fines & Alerts Tracking:** Live verification of pending or paid monetary penalties with explicit formatting.
4. **Dynamic Server Configuration:** Allows easily switching the API Gateway target URL (e.g., local `http://localhost` vs AWS QA `https://kleberchiliquingaqa1.distribuidauce.org`).

---

## 🛠️ How to Run Locally

### 1. Prerequisites
Ensure you have **Node.js** and **npm** installed on your operating system (Windows, macOS, or Linux).

### 2. Installation & Execution
```bash
# Enter the desktop application directory
cd apps/desktop

# Install Electron dependencies
npm install

# Start the application in a native window
npm run start
```

### 3. Shortcuts & Usage
- **`Ctrl + R` / `Cmd + R`:** Hot reload the UI without closing the native window.
- **QA Test Credentials:** You can log in with the administrator account `qa.tester@uce.edu.ec` and password `TestSeguro2026`.

---
## 👨‍💻 Author & Developer

**Kleber Alejandro Chiliquinga Lara**  
*Course: Distributed Programming*  
Universidad Central del Ecuador (UCE)

---
*📚 UCE Library Distributed System - 2026*
