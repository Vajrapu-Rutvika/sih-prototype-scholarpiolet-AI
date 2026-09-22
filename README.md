# ScholarPilot AI

An intelligent scholarship matching and application tracking platform designed to help students discover, organize, and apply for financial aid effortlessly.

## 🌟 Features

- **Smart Matching Engine**: Rule-based AI engine that scores scholarships against the student's profile.
- **Eligibility Checking**: Instantly verify eligibility before spending time on applications.
- **Application Tracking**: Keep track of saved, preparing, and submitted applications in one place.
- **Document Vault**: Manage all official documents with mocked verification status.
- **AI Copilot**: Contextual chat assistant to guide users on their application journey.
- **Premium UI**: Modern, responsive, and accessible interface with Dark Mode support built using React, Vite, and Tailwind CSS v4.

## 🛠️ Technology Stack

### Backend
- **Framework**: Django REST Framework
- **Database**: SQLite (Development)
- **Authentication**: JWT (JSON Web Tokens)
- **Architecture**: Modular apps (`accounts`, `scholarships`, `applications`, `documents`, `notifications`, `ai_engine`)

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Seed the database with demo data:
   ```bash
   python manage.py seed_scholarships
   ```
6. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 📱 Usage
Visit `http://localhost:5173` in your browser. Use the provided demo credentials (if set up via seed script) or register a new student account to explore the dashboard, discover scholarships, and test the AI Copilot.

## 👥 Contributors
Built for the Smart India Hackathon (SIH).
