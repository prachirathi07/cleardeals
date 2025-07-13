# AI Lead Scoring Dashboard

A web-based lead scoring dashboard that predicts lead intent using machine learning and rule-based reranking for real estate brokers.

## 🎯 Project Overview

This application helps brokers prioritize high-intent prospects by delivering an "Intent Score" (0-100) using:
- **ML Model**: XGBoost for initial scoring based on lead characteristics
- **LLM Reranker**: Rule-based system that adjusts scores based on comments and contextual signals
- **Real-time API**: FastAPI backend for instant scoring
- **Modern UI**: Next.js frontend with responsive design

## 🏗️ Architecture

```
Frontend (Next.js) → FastAPI Backend → ML Model (XGBoost) + Reranker
```

### Key Features
- Lead data input with validation
- Real-time scoring via API
- Score adjustment based on comments
- Results table with sorting/filtering
- Mobile-responsive design
- Data persistence (localStorage)

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python train_model.py  # Train and save ML model
uvicorn main:app --reload  # Start FastAPI server
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Start Next.js development server
```

### Access the Application
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

## 📊 Dataset

The synthetic dataset includes 10,000+ leads with meaningful relationships:
- **Digital Behavior**: Property search frequency, budget tool usage
- **Socioeconomic**: Credit score, income, employment type
- **Contextual**: Age group, family background, property preferences
- **Financial**: Loan amount, down payment, EMI affordability

## 🤖 ML Model

- **Algorithm**: XGBoost Classifier
- **Features**: 15+ engineered features including recency-weighted behaviors
- **Output**: Intent score (0-100) with confidence metrics
- **Training**: 70/30 split with cross-validation

## 🔄 Reranker Logic

Rule-based system that adjusts ML scores based on comments:
- "urgent" → +10 points
- "ready to buy" → +15 points
- "not interested" → -10 points
- "just browsing" → -5 points
- Life event keywords → +5 to +20 points

## 📁 Project Structure

```
cleardeals/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── model/
│   │   ├── train_model.py   # Model training script
│   │   └── lead_scorer.py   # ML model wrapper
│   ├── data/
│   │   └── synthetic_leads.csv
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🛠️ Technologies Used

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **ML**: XGBoost, scikit-learn, pandas
- **Deployment**: Netlify (frontend), Render (backend)

## 📈 Performance Metrics

- API Latency: <300ms
- Model Accuracy: >85%
- Mobile Responsiveness: 100%
- Browser Compatibility: Modern browsers

## 🔒 Privacy & Compliance

- Data hashing for pseudonymous scoring
- Explicit consent checkbox required
- No real PII collection (demo data only)
- DPDP-ready architecture

## 📝 API Endpoints

- `POST /score` - Score a new lead
- `GET /leads` - Get all scored leads
- `GET /health` - Health check

## 🚀 Deployment

### Frontend (Netlify)
```bash
cd frontend
npm run build
# Deploy to Netlify
```

### Backend (Render)
```bash
# Connect GitHub repo to Render
# Set environment variables
# Deploy automatically
```

## 👨‍💻 Author

**Prachi Rathi**
- Email: prachi13rathi@gmail.com
- LinkedIn: https://www.linkedin.com/in/prachi-rathi-37755b249/
- GitHub: https://github.com/prachirathi07

## 📄 License

This project is created for the ClearDeals AI Engineer Intern position. 