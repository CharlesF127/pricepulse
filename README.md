# 📈 PricePulse — Real-Time Product Price Tracking SaaS

PricePulse is a full‑stack SaaS platform that tracks real‑time product prices, displays historical charts, and sends alerts when thresholds are met. It includes a modular scraping engine, automated cron tasks, email notifications, socket‑based real‑time updates, and a polished Vite + React UI.

---

## 🚀 Tech Stack

### **Frontend**

* React + Vite
* TypeScript
* TailwindCSS + ShadCN UI
* React Query
* Recharts (Charts)
* Socket.io client

### **Backend**

* Node.js + Express
* MongoDB + Mongoose
* Puppeteer Scraper Engine
* Cron Jobs (node-cron)
* Nodemailer (Email alerts)
* Socket.io (Real-time events)
* JWT Authentication

### **Deployment Targets**

* Netlify or Vercel → Frontend
* Render → Backend
* Custom Domain → `pricepulse.pro`

---

## 📁 Project Structure

```
PricePulse/
│
├── backend/
│   ├── agents/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env               # not committed
│
└── frontend/
    ├── public/
    ├── src/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── .env               # not committed
```

---

## 🛠️ Local Development Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/<your-username>/pricepulse.git
cd pricepulse
```

---

## 🔧 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Environment variables (`frontend/.env`):

```
VITE_API_BASE_URL=http://localhost:5000
```

Frontend runs at:
👉 [http://localhost:8080](http://localhost:8080)

---

## 🔧 Backend Setup

```bash
cd backend
npm install
npm run dev
```

Environment variables (`backend/.env`):

```
MONGO_URI=your-mongodb-connection-string
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLIENT_ORIGIN=http://localhost:8080
```

Backend runs at:
👉 [http://localhost:5000](http://localhost:5000)

---

## 🔄 Background Jobs

The backend includes automated cron tasks that:

* Scrape product prices every hour
* Save historical price data
* Trigger alerts based on thresholds
* Push notifications in real time via Socket.io
* Send emails when alerts fire

---

## 🔔 Real-Time Alerts (Socket.io)

The system pushes live updates for:

* Price alerts
* Dashboard updates
* Notification badge counters

---

## 🌐 Deployment Guide

### **Backend → Render**

**Settings:**

* Root Directory: `backend`
* Build command: `npm install`
* Start command: `npm start`

Set environment variables inside Render Dashboard.

---

### **Frontend → Netlify (Recommended)**

**Settings:**

* Base Directory: `frontend`
* Build Command: `npm run build`
* Publish Directory: `frontend/dist`

**Environment:**

```
VITE_API_BASE_URL=https://<your-render-backend>.onrender.com
```

---

## 🌍 Custom Domain (pricepulse.pro)

Point your domain to your frontend:

```
CNAME → your-site.netlify.app
```

(Optional backend subdomain)

```
api.pricepulse.pro → Render server URL
```

---

## 🔐 Environment & Security

* Secrets stored only in `.env` files
* All `.env` files excluded from Git via `.gitignore`
* JWT-based authentication
* Strict CORS with approved origin

---

## 📄 License

Proprietary — All rights reserved.

---

## 🙌 Author

**Charles Foote** — Creator of PricePulse
