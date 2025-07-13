from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional, Dict, Any
import pandas as pd
from datetime import datetime
import re
from db import SessionLocal, Lead
from model.lead_scorer import LeadScorer
from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Initialize FastAPI app
app = FastAPI(
    title="AI Lead Scoring API",
    description="API for scoring real estate leads using ML and rule-based reranking",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize lead scorer
lead_scorer = LeadScorer()

# Pydantic models for request/response validation
class LeadData(BaseModel):
    phone: str
    email: EmailStr
    credit_score: int
    age_group: str
    family_background: str
    income: int
    employment_type: str
    property_type: str
    loan_amount: int
    down_payment: int
    property_search_frequency: int = 2
    budget_tool_usage: int = 1
    listing_saves: int = 3
    email_clicks: int = 1
    whatsapp_interactions: int = 2
    time_to_purchase: int = 8
    emi_affordability: float = 2.5
    job_stability: float = 4.0
    comments: str = ""
    consent: bool = False
    
    @validator('phone')
    def validate_phone(cls, v):
        # Basic Indian phone number validation
        phone_pattern = r'^\+91-[6-9]\d{9}$'
        if not re.match(phone_pattern, v):
            raise ValueError('Phone number must be in format +91-XXXXXXXXXX')
        return v
    
    @validator('credit_score')
    def validate_credit_score(cls, v):
        if not 300 <= v <= 850:
            raise ValueError('Credit score must be between 300 and 850')
        return v
    
    @validator('income')
    def validate_income(cls, v):
        if v <= 0:
            raise ValueError('Income must be positive')
        return v
    
    @validator('loan_amount')
    def validate_loan_amount(cls, v):
        if v <= 0:
            raise ValueError('Loan amount must be positive')
        return v
    
    @validator('down_payment')
    def validate_down_payment(cls, v):
        if v <= 0:
            raise ValueError('Down payment must be positive')
        return v
    
    @validator('age_group')
    def validate_age_group(cls, v):
        valid_groups = ['18-25', '26-35', '36-50', '51+']
        if v not in valid_groups:
            raise ValueError(f'Age group must be one of: {valid_groups}')
        return v
    
    @validator('family_background')
    def validate_family_background(cls, v):
        valid_backgrounds = ['Single', 'Married', 'Married with Kids']
        if v not in valid_backgrounds:
            raise ValueError(f'Family background must be one of: {valid_backgrounds}')
        return v
    
    @validator('employment_type')
    def validate_employment_type(cls, v):
        valid_types = ['Salaried', 'Self-Employed', 'Business Owner', 'Freelancer']
        if v not in valid_types:
            raise ValueError(f'Employment type must be one of: {valid_types}')
        return v
    
    @validator('property_type')
    def validate_property_type(cls, v):
        valid_types = ['Apartment', 'Villa', 'Plot', 'Commercial']
        if v not in valid_types:
            raise ValueError(f'Property type must be one of: {valid_types}')
        return v
    
    @validator('consent')
    def validate_consent(cls, v):
        if not v:
            raise ValueError('Consent is required for data processing')
        return v

class LeadResponse(BaseModel):
    initial_score: int
    reranked_score: int
    intent_level: str
    explanation: str
    hashed_email: str
    hashed_phone: str
    timestamp: str
    error: Optional[str] = None

class LeadRecord(BaseModel):
    id: str
    email: str
    phone: str
    initial_score: int
    reranked_score: int
    intent_level: str
    comments: str
    timestamp: str

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "AI Lead Scoring API",
        "version": "1.0.0",
        "author": "Prachi Rathi",
        "endpoints": {
            "POST /score": "Score a new lead",
            "GET /leads": "Get all scored leads",
            "GET /health": "Health check",
            "GET /stats": "Get scoring statistics"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    db = SessionLocal()
    total_leads = db.query(Lead).count()
    db.close()
    model_status = "loaded" if lead_scorer.model_loaded else "not_loaded"
    return {
        "status": "healthy",
        "model_status": model_status,
        "timestamp": datetime.now().isoformat(),
        "total_leads_scored": total_leads
    }

@app.post("/score", response_model=LeadResponse)
async def score_lead(lead_data: LeadData):
    """Score a lead using ML model and rule-based reranker"""
    
    try:
        # Convert Pydantic model to dict
        lead_dict = lead_data.dict()
        
        # Score the lead
        result = lead_scorer.score_lead(lead_dict)
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        db = SessionLocal()
        # Store lead record (without sensitive data)
        db_lead = Lead(
            email=lead_data.email,
            phone=lead_data.phone,
            initial_score=result['initial_score'],
            reranked_score=result['reranked_score'],
            intent_level=result['intent_level'],
            comments=lead_data.comments,
            timestamp=result['timestamp']
        )
        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        db.close()
        
        return LeadResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")

@app.get("/leads", response_model=List[LeadRecord])
async def get_leads():
    """Get all scored leads"""
    db = SessionLocal()
    leads = db.query(Lead).all()
    db.close()
    return [LeadRecord(
        id=str(lead.id),
        email=lead.email,
        phone=lead.phone,
        initial_score=lead.initial_score,
        reranked_score=lead.reranked_score,
        intent_level=lead.intent_level,
        comments=lead.comments,
        timestamp=lead.timestamp
    ) for lead in leads]

@app.get("/stats")
async def get_stats():
    """Get scoring statistics"""
    db = SessionLocal()
    leads = db.query(Lead).all()
    db.close()
    if not leads:
        return {
            "total_leads": 0,
            "average_initial_score": 0,
            "average_reranked_score": 0,
            "intent_distribution": {},
            "model_loaded": lead_scorer.model_loaded
        }
    
    initial_scores = [lead.initial_score for lead in leads]
    reranked_scores = [lead.reranked_score for lead in leads]
    intent_levels = [lead.intent_level for lead in leads]
    
    # Calculate intent distribution
    intent_distribution = {}
    for level in intent_levels:
        intent_distribution[level] = intent_distribution.get(level, 0) + 1
    
    return {
        "total_leads": len(leads),
        "average_initial_score": round(sum(initial_scores) / len(initial_scores), 2),
        "average_reranked_score": round(sum(reranked_scores) / len(reranked_scores), 2),
        "intent_distribution": intent_distribution,
        "model_loaded": lead_scorer.model_loaded,
        "feature_importance": lead_scorer.get_feature_importance()
    }

@app.get("/sample-data")
async def get_sample_data():
    """Get sample lead data for testing"""
    return {
        "sample_lead": {
            "phone": "+91-9876543210",
            "email": "john.doe@example.com",
            "credit_score": 750,
            "age_group": "26-35",
            "family_background": "Married",
            "income": 800000,
            "employment_type": "Salaried",
            "property_type": "Apartment",
            "loan_amount": 5000000,
            "down_payment": 1000000,
            "property_search_frequency": 5,
            "budget_tool_usage": 3,
            "listing_saves": 8,
            "email_clicks": 4,
            "whatsapp_interactions": 6,
            "time_to_purchase": 6,
            "emi_affordability": 3.2,
            "job_stability": 5.5,
            "comments": "Looking for a 2BHK apartment urgently. Ready to buy within 2 months.",
            "consent": True
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 