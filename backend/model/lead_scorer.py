import joblib
import pandas as pd
import numpy as np
import re
from typing import Dict, Any, Tuple
import hashlib
import os

class LeadScorer:
    def __init__(self):
        """Initialize the lead scorer with trained model and preprocessing objects"""
        try:
            self.model = joblib.load('model/xgboost_model.pkl')
            self.scaler = joblib.load('model/scaler.pkl')
            self.label_encoders = joblib.load('model/label_encoders.pkl')
            self.feature_names = joblib.load('model/feature_names.pkl')
            self.model_loaded = True
            print("XGBoost model loaded successfully")
        except FileNotFoundError:
            print("Warning: XGBoost model files not found. Please run train_model.py first.")
            self.model_loaded = False
    
    def _hash_pii(self, data: str) -> str:
        """Hash PII data for privacy compliance"""
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def _extract_features(self, lead_data: Dict[str, Any]) -> pd.DataFrame:
        """Extract and prepare features from lead data"""
        
        # Basic features
        features = {
            'credit_score': lead_data.get('credit_score', 600),
            'income': lead_data.get('income', 500000),
            'loan_amount': lead_data.get('loan_amount', 3000000),
            'down_payment': lead_data.get('down_payment', 600000),
            'property_search_frequency': lead_data.get('property_search_frequency', 2),
            'budget_tool_usage': lead_data.get('budget_tool_usage', 1),
            'listing_saves': lead_data.get('listing_saves', 3),
            'email_clicks': lead_data.get('email_clicks', 1),
            'whatsapp_interactions': lead_data.get('whatsapp_interactions', 2),
            'time_to_purchase': lead_data.get('time_to_purchase', 8),
            'emi_affordability': lead_data.get('emi_affordability', 2.5),
            'job_stability': lead_data.get('job_stability', 4.0)
        }
        
        # Categorical features
        categorical_features = {
            'age_group': lead_data.get('age_group', '26-35'),
            'family_background': lead_data.get('family_background', 'Married'),
            'employment_type': lead_data.get('employment_type', 'Salaried'),
            'property_type': lead_data.get('property_type', 'Apartment')
        }
        
        # Encode categorical variables
        for col, value in categorical_features.items():
            if col in self.label_encoders:
                try:
                    features[col] = self.label_encoders[col].transform([value])[0]
                except ValueError:
                    # Handle unseen categories
                    features[col] = 0
        
        # Create engineered features
        features['income_to_loan_ratio'] = features['income'] / features['loan_amount']
        features['down_payment_ratio'] = features['down_payment'] / features['loan_amount']
        features['digital_engagement'] = (
            features['property_search_frequency'] + 
            features['budget_tool_usage'] + 
            features['listing_saves'] + 
            features['email_clicks'] + 
            features['whatsapp_interactions']
        )
        features['urgency_score'] = 100 / (features['time_to_purchase'] + 1)
        
        # Create DataFrame with correct column order
        df = pd.DataFrame([features])
        return df[self.feature_names]
    
    def _apply_reranker(self, initial_score: float, comments: str) -> Tuple[float, str]:
        """Apply rule-based reranker to adjust score based on comments"""
        
        if not comments:
            return initial_score, "No comments provided"
        
        comments_lower = comments.lower()
        adjustment = 0
        reasons = []
        
        # Urgency keywords
        urgency_keywords = {
            'urgent': 10,
            'asap': 15,
            'immediately': 15,
            'quick': 8,
            'fast': 8,
            'soon': 5
        }
        
        # Purchase intent keywords
        purchase_keywords = {
            'ready to buy': 15,
            'want to buy': 12,
            'looking to purchase': 10,
            'interested in buying': 8,
            'ready to invest': 12,
            'want to invest': 10
        }
        
        # Life event keywords
        life_event_keywords = {
            'marriage': 10,
            'married': 5,
            'baby': 15,
            'child': 10,
            'family': 8,
            'relocation': 12,
            'job change': 8,
            'promotion': 5
        }
        
        # Negative keywords
        negative_keywords = {
            'not interested': -15,
            'just browsing': -10,
            'not ready': -8,
            'maybe later': -5,
            'too expensive': -5,
            'out of budget': -8
        }
        
        # Check all keyword categories
        for keyword, score in urgency_keywords.items():
            if keyword in comments_lower:
                adjustment += score
                reasons.append(f"Urgency: {keyword}")
        
        for keyword, score in purchase_keywords.items():
            if keyword in comments_lower:
                adjustment += score
                reasons.append(f"Purchase intent: {keyword}")
        
        for keyword, score in life_event_keywords.items():
            if keyword in comments_lower:
                adjustment += score
                reasons.append(f"Life event: {keyword}")
        
        for keyword, score in negative_keywords.items():
            if keyword in comments_lower:
                adjustment += score
                reasons.append(f"Negative signal: {keyword}")
        
        # Apply adjustment
        final_score = initial_score + adjustment
        final_score = max(0, min(100, final_score))  # Clamp between 0-100
        
        # Create explanation
        if reasons:
            explanation = f"Score adjusted by {adjustment} points: {', '.join(reasons)}"
        else:
            explanation = "No significant keywords found in comments"
        
        return final_score, explanation
    
    def score_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """Score a lead and return results"""
        
        if not self.model_loaded:
            return {
                'error': 'Model not loaded. Please run train_model.py first.',
                'initial_score': 0,
                'reranked_score': 0,
                'explanation': 'Model unavailable'
            }
        
        try:
            # Hash PII for privacy
            hashed_email = self._hash_pii(lead_data.get('email', ''))
            hashed_phone = self._hash_pii(lead_data.get('phone', ''))
            
            # Extract features
            features = self._extract_features(lead_data)
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Get initial score (probability of high intent)
            initial_prob = self.model.predict_proba(features_scaled)[0][1]
            initial_score = int(initial_prob * 100)
            
            # Apply reranker
            comments = lead_data.get('comments', '')
            reranked_score, explanation = self._apply_reranker(initial_score, comments)
            
            # Determine intent level
            if reranked_score >= 80:
                intent_level = "Very High"
            elif reranked_score >= 60:
                intent_level = "High"
            elif reranked_score >= 40:
                intent_level = "Medium"
            elif reranked_score >= 20:
                intent_level = "Low"
            else:
                intent_level = "Very Low"
            
            return {
                'initial_score': initial_score,
                'reranked_score': int(reranked_score),
                'intent_level': intent_level,
                'explanation': explanation,
                'hashed_email': hashed_email,
                'hashed_phone': hashed_phone,
                'timestamp': pd.Timestamp.now().isoformat()
            }
            
        except Exception as e:
            return {
                'error': f'Scoring failed: {str(e)}',
                'initial_score': 0,
                'reranked_score': 0,
                'explanation': 'Error occurred during scoring'
            }
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the model"""
        if not self.model_loaded:
            return {}
        
        try:
            importance = self.model.feature_importances_
            feature_importance = dict(zip(self.feature_names, importance))
            return dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
        except:
            return {} 