# 🌐 UCE Library - Administrative & Student Web Portal (Frontend App)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-000000?style=for-the-badge&logo=react&logoColor=white)

The **Frontend Web SPA (Single Page Application)** is the graphical centerpiece of **UCE Library**. Built with **React 18, Vite, and Tailwind CSS**, it delivers a modern, responsive, and high-performance user experience for both the student body and library administrators at Universidad Central del Ecuador.

---

## 🏛️ Role in the Ecosystem & Differentiation

Unlike the desktop kiosk application (designed for rapid counter consultations), the Web Frontend is a comprehensive management portal:
1. **Student Portal (`/user/*`):** Allows students to explore the catalog, search for books, request online book loans, check return due dates, and pay monetary fines with credit cards via Stripe.
2. **Administrative Panel (`/admin/*`):** Enables librarians to onboard new institutional users, upload book cover images, manage physical inventory, process book returns, and generate high-management PDF reports.

---

## 🏛️ Architecture & State Management

```
src/
├── api/                # HTTP clients and Axios configuration (API Gateway connector)
├── components/         # Reusable UI components (Navbar, Sidebar, Modals, Badges)
├── pages/              # Main views separated by role (Auth, User, Admin)
│   ├── admin/          # AdminCatalog, AdminInventory, AdminLoans, AdminUsers, AdminReports
│   └── user/           # UserCatalog, UserLoans, MyFines, UserProfile
├── store/              # Global state management with Zustand (authStore, catalogStore, etc.)
└── App.jsx             # Protected routing with React Router Dom
```

---

## 🚀 Key Features

1. **Avant-Garde UI/UX Design:** Enriched interface featuring **Lucide React** iconography, smooth transitions, and interactive notifications (**React Hot Toast**).
2. **RBAC (Role-Based Access Control) Security:** Intelligent routing that protects administrative views based on JWT token claims.
3. **Centralized Communication:** Connects directly to the **API Gateway** at `/api/*` without worrying about individual ports across 10 AWS microservices.
4. **Document Exporting:** Live analytics visualization and instant PDF report downloads in real time.

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `apps/frontend` (or configure via Vite):

```ini
VITE_API_URL=https://kleberchiliquingaqa1.distribuidauce.org
VITE_STRIPE_PUBLIC_KEY=pk_test_mock_stripe_public_key_uce_2026
```

---

## 🛠️ How to Run Locally

### 1. Installation & Execution
```bash
# Enter the frontend directory
cd apps/frontend

# Install dependencies
npm install

# Start ultra-fast development server (Vite)
npm run dev
```
The application will automatically launch at `http://localhost:5173` (or the local port configured by Vite).

### 2. Production Build
```bash
# Generate optimized static bundle for AWS / Nginx
npm run build
```

---
## 👨‍💻 Author & Developer

**Kleber Alejandro Chiliquinga Lara**  
*Course: Distributed Programming*  
Universidad Central del Ecuador (UCE)

---
*📚 UCE Library Distributed System - 2026*
