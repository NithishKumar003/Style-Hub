# StyleHub – Fashion Mini Store

StyleHub is a full-stack fashion shopping application built to practise and demonstrate frontend development, backend API development, authentication, database operations, and payment integration.

The application includes a customer shopping flow and a separate admin section for managing products and orders. I built it using FastAPI and React, with SQLite for data storage and Stripe for test payments.

## Features

### Customer
- Register and log in to an account.
- Browse available products.
- Add products to the cart, update quantities, and remove items.
- View the cart total before placing an order.
- Place orders using Cash on Delivery or Stripe test payments.
- View previous orders and their details.
- Track order status.

### Admin
- Access protected admin pages.
- View dashboard information.
- Add, update, and deactivate products.
- View customer orders.
- Update order statuses.

### Payment and security
- JWT-based authentication for protected routes.
- Password hashing for account security.
- Role-based access for customers and administrators.
- Stripe integration for testing payment success and failure flows.
- Backend validation of order and payment information.
- Environment variables for application secrets and payment configuration.

## Tech Stack

**Frontend**
- React
- Vite
- React Router
- Axios
- CSS
- Stripe.js

**Backend**
- Python
- FastAPI
- SQLAlchemy ORM
- Pydantic
- SQLite
- JWT authentication
- Password hashing
- Stripe API

## Project Structure

```text
Style-Hub/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── database/
│   │   ├── dependencies/
│   │   ├── models/
│   │   ├── routers/
│   │   └── schemas/
│   ├── requirements.txt
│   └── create_admin.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

Make sure Python, Node.js, npm, and Git are installed on your system.

### 1. Clone the repository

```bash
git clone https://github.com/NithishKumar003/Style-Hub.git
cd Style-Hub
```

### 2. Set up the backend

Open a terminal in the project root and run:

```powershell
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```powershell
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory. Add the environment variables required by `backend/app/core/config.py`.

For example, the configuration may include:

```env
SECRET_KEY=replace_with_a_long_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

STRIPE_SECRET_KEY=sk_test_replace_with_your_test_secret
STRIPE_PUBLISHABLE_KEY=pk_test_replace_with_your_test_publishable_key
```

Use the exact variable names expected by the application configuration. If your code uses different names, update this example to match. Never commit real API keys or production secrets.

Start the backend using the command configured for your FastAPI application. For a standard setup where `app.main` exposes the FastAPI instance as `app`, run:

```powershell
uvicorn app.main:app --reload
```

The backend will normally be available at:

`http://127.0.0.1:8000`

FastAPI's interactive API documentation is available at:

`http://127.0.0.1:8000/docs`

### 3. Set up the frontend

Open a second terminal:

```powershell
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory if your frontend configuration requires one. Set the backend API URL using the variable name expected by `frontend/src/api/axios.js`.

For a Vite application using `VITE_API_URL`, an example is:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_with_your_test_publishable_key
```

These are examples only. Check your existing configuration before using them. A frontend environment variable is visible to users in the browser, so never put Stripe secret keys or JWT signing secrets in the frontend.

Start the frontend:

```powershell
npm run dev
```

Vite will display the local URL in the terminal, commonly:

`http://localhost:5173`

### 4. Create an admin account

The backend contains a `create_admin.py` script for creating an administrator account. Check its required arguments or prompts, then run it from the backend directory using the virtual environment.

Keep administrator credentials private and use a strong password.

## Running the Application

For local development, keep the backend and frontend running in separate terminals:

- Backend: `http://127.0.0.1:8000`
- API documentation: `http://127.0.0.1:8000/docs`
- Frontend: `http://localhost:5173`

Make sure the frontend API configuration points to the running backend.

## Testing

The frontend includes ESLint and a Vite production build.

Run these commands from the `frontend` directory:

```bash
npm run lint
npm run build
```

Both commands completed successfully during my latest local verification.

Payment testing should be done using Stripe test mode and test credentials. Do not use real customer payment details for development testing.

## Notes

- This project is intended for learning and demonstration.
- Stripe is configured for test payments, not live transactions.
- The database is local SQLite storage by default.
- Keep `.env` files, database files, virtual environments, and `node_modules` out of Git.
- Before deploying publicly, review CORS settings, environment configuration, database migrations, logging, and production security.

## Author

**Nithish Kumar E**

GitHub: https://github.com/NithishKumar003
