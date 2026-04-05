# Brads Apartment Managers

A web-based Rental Management and Payment Tracking System (RMPTS) for landlords and tenants, with M-Pesa rent payments via the MegaPay STK Push API.

---

## Architecture

This project has exactly two parts:

```
brads-apartment/
  backend/    Node.js + Express.js  (runs on your laptop, port 5000)
  frontend/   React.js              (runs in the browser, port 3000)
```

There is one backend only. It connects to MongoDB and handles all business logic, authentication, and MegaPay payment calls.

---

## Technology Stack

| Layer          | Technology                  |
|----------------|-----------------------------|
| Frontend       | React.js (Create React App) |
| Backend        | Node.js + Express.js        |
| Database       | MongoDB + Mongoose          |
| Payments       | MegaPay M-Pesa STK Push     |
| Authentication | JWT + bcrypt                |
| Scheduling     | node-cron                   |

---

## Project Structure

```
backend/
  src/
    server.js               Express entry point, MongoDB connection, cron job
    middleware/auth.js      JWT authentication and role guard
    models/
      User.js               Landlords and tenants
      Apartment.js          Apartment properties
      Unit.js               Individual rental units
      Payment.js            Payment transactions
      Notification.js       In-app notifications
    routes/
      auth.js               Register, login, profile
      apartments.js         Apartment CRUD
      units.js              Unit CRUD, occupancy, tenant selection
      payments.js           MegaPay STK Push, polling, history
      tenants.js            Tenant listing and removal
      notifications.js      Notification management
    utils/
      reminderService.js    Monthly rent reset and reminders

frontend/
  src/
    App.js                  Router and providers
    index.css               CSS variables (light/dark theme)
    context/
      AuthContext.js        User session
      ThemeContext.js       Light/dark toggle
    utils/api.js            Axios with JWT header
    pages/
      Landing.js            Role selection
      Login.js              Login
      Register.js           Registration
      LandlordDashboard.js  Landlord layout
      TenantDashboard.js    Tenant layout
    components/
      UI.js                 Shared components
      Navbar.js             Navigation with notifications
      landlord/             Overview, Apartments, Units, Tenants, Payments
      tenant/               TenantHome, PaymentSection, TenantPayments
```

---

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in .env (see below)
npm run dev
```

**.env values:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/brads-apartment
JWT_SECRET=replace_with_long_random_secret
MEGAPAY_API_KEY=your_megapay_api_key
MEGAPAY_EMAIL=your_megapay_email@gmail.com
FRONTEND_URL=http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

**.env values:**
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## How Payments Work

**New tenant:** pays rent + deposit on first payment via M-Pesa STK Push.
**Continuing tenant:** pays rent only each month.

The backend decides which type applies — the frontend just sends the phone number.

Payment status updates automatically every 5 seconds:
- **Completed** when MegaPay confirms (ResponseCode 0)
- **Cancelled** when tenant dismisses the prompt (ResponseCode 1032)
- **Failed** for all other error codes

Rent resets to unpaid on the 5th of every month via a daily cron job.
Reminders fire 3 days before, on, and 3 days after the due date.
