import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import xgboost as xgb
import joblib
import re
from datetime import datetime, timedelta
import random

def generate_synthetic_leads(n_samples=10000):
    """Generate synthetic lead data with meaningful relationships"""
    
    np.random.seed(42)
    random.seed(42)
    
    # Age groups with realistic distributions
    age_groups = ['18-25', '26-35', '36-50', '51+']
    age_weights = [0.15, 0.45, 0.30, 0.10]
    
    # Family backgrounds
    family_backgrounds = ['Single', 'Married', 'Married with Kids']
    family_weights = [0.25, 0.35, 0.40]
    
    # Employment types
    employment_types = ['Salaried', 'Self-Employed', 'Business Owner', 'Freelancer']
    employment_weights = [0.60, 0.20, 0.15, 0.05]
    
    # Property types
    property_types = ['Apartment', 'Villa', 'Plot', 'Commercial']
    property_weights = [0.50, 0.25, 0.15, 0.10]
    
    # Generate data
    data = []
    
    for i in range(n_samples):
        # Basic demographics
        age_group = np.random.choice(age_groups, p=age_weights)
        family_bg = np.random.choice(family_backgrounds, p=family_weights)
        employment = np.random.choice(employment_types, p=employment_weights)
        property_type = np.random.choice(property_types, p=property_weights)
        
        # Income based on age and employment
        if age_group == '18-25':
            income = np.random.normal(300000, 50000)
        elif age_group == '26-35':
            income = np.random.normal(600000, 100000)
        elif age_group == '36-50':
            income = np.random.normal(900000, 150000)
        else:
            income = np.random.normal(1200000, 200000)
        
        # Adjust income based on employment
        if employment == 'Self-Employed':
            income *= 1.2
        elif employment == 'Business Owner':
            income *= 1.5
        elif employment == 'Freelancer':
            income *= 0.8
        
        # Credit score based on income and age
        base_credit = 600 + (income - 500000) / 10000
        credit_score = np.clip(np.random.normal(base_credit, 50), 300, 850)
        
        # Loan amount (typically 5-8x annual income)
        loan_multiplier = np.random.uniform(5, 8)
        loan_amount = income * loan_multiplier
        
        # Down payment (20-40% of property value)
        down_payment_pct = np.random.uniform(0.2, 0.4)
        down_payment = loan_amount * down_payment_pct
        
        # Digital behavior features
        property_search_frequency = np.random.poisson(3)  # Searches per week
        budget_tool_usage = np.random.poisson(2)  # Times used
        listing_saves = np.random.poisson(5)  # Saved listings
        email_clicks = np.random.poisson(2)  # Email engagement
        whatsapp_interactions = np.random.poisson(3)  # WhatsApp responses
        
        # Time to purchase (months)
        if family_bg == 'Married with Kids':
            time_to_purchase = np.random.exponential(6)  # More urgent
        elif family_bg == 'Married':
            time_to_purchase = np.random.exponential(8)
        else:
            time_to_purchase = np.random.exponential(12)  # Less urgent
        
        # EMI affordability ratio
        emi_amount = (loan_amount * 0.08) / 12  # 8% annual rate
        emi_affordability = income / (emi_amount * 12)
        
        # Job stability (years)
        if employment == 'Salaried':
            job_stability = np.random.exponential(5)
        elif employment == 'Business Owner':
            job_stability = np.random.exponential(8)
        else:
            job_stability = np.random.exponential(3)
        
        # Lead intent (target variable) - based on multiple factors
        intent_score = 0
        
        # Income factor
        if income > 800000:
            intent_score += 25
        elif income > 500000:
            intent_score += 15
        else:
            intent_score += 5
        
        # Credit score factor
        if credit_score > 750:
            intent_score += 20
        elif credit_score > 650:
            intent_score += 15
        else:
            intent_score += 5
        
        # Digital engagement factor
        intent_score += min(property_search_frequency * 2, 15)
        intent_score += min(budget_tool_usage * 3, 15)
        intent_score += min(listing_saves * 1.5, 10)
        intent_score += min(email_clicks * 2, 10)
        intent_score += min(whatsapp_interactions * 2, 10)
        
        # Time urgency factor
        if time_to_purchase < 6:
            intent_score += 15
        elif time_to_purchase < 12:
            intent_score += 10
        else:
            intent_score += 5
        
        # EMI affordability factor
        if emi_affordability > 3:
            intent_score += 10
        elif emi_affordability > 2:
            intent_score += 5
        
        # Add some randomness
        intent_score += np.random.normal(0, 5)
        intent_score = np.clip(intent_score, 0, 100)
        
        # Determine high/low intent
        high_intent = intent_score > 60
        
        # Generate phone and email
        phone = f"+91-{random.randint(7000000000, 9999999999)}"
        email = f"lead{i}@example.com"
        
        data.append({
            'phone': phone,
            'email': email,
            'credit_score': int(credit_score),
            'age_group': age_group,
            'family_background': family_bg,
            'income': int(income),
            'employment_type': employment,
            'property_type': property_type,
            'loan_amount': int(loan_amount),
            'down_payment': int(down_payment),
            'property_search_frequency': property_search_frequency,
            'budget_tool_usage': budget_tool_usage,
            'listing_saves': listing_saves,
            'email_clicks': email_clicks,
            'whatsapp_interactions': whatsapp_interactions,
            'time_to_purchase': int(time_to_purchase),
            'emi_affordability': round(emi_affordability, 2),
            'job_stability': round(job_stability, 1),
            'intent_score': int(intent_score),
            'high_intent': high_intent
        })
    
    return pd.DataFrame(data)

def prepare_features(df):
    """Prepare features for ML model"""
    
    # Create feature dataframe
    feature_cols = [
        'credit_score', 'income', 'loan_amount', 'down_payment',
        'property_search_frequency', 'budget_tool_usage', 'listing_saves',
        'email_clicks', 'whatsapp_interactions', 'time_to_purchase',
        'emi_affordability', 'job_stability'
    ]
    
    # Categorical features
    categorical_cols = ['age_group', 'family_background', 'employment_type', 'property_type']
    
    # Create feature matrix
    X = df[feature_cols].copy()
    
    # Encode categorical variables
    label_encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(df[col])
        label_encoders[col] = le
    
    # Create engineered features
    X['income_to_loan_ratio'] = X['income'] / X['loan_amount']
    X['down_payment_ratio'] = X['down_payment'] / X['loan_amount']
    X['digital_engagement'] = (X['property_search_frequency'] + 
                              X['budget_tool_usage'] + 
                              X['listing_saves'] + 
                              X['email_clicks'] + 
                              X['whatsapp_interactions'])
    X['urgency_score'] = 100 / (X['time_to_purchase'] + 1)
    
    # Target variable
    y = df['high_intent']
    
    return X, y, label_encoders

def train_model():
    """Train and save the XGBoost model"""
    
    print("Generating synthetic lead data...")
    df = generate_synthetic_leads(10000)
    
    print("Preparing features...")
    X, y, label_encoders = prepare_features(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("Training XGBoost model...")
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss'
    )
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"Model Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model and preprocessing objects
    print("Saving model and preprocessing objects...")
    joblib.dump(model, 'model/xgboost_model.pkl')
    joblib.dump(scaler, 'model/scaler.pkl')
    joblib.dump(label_encoders, 'model/label_encoders.pkl')
    
    # Save feature names for later use
    feature_names = X.columns.tolist()
    joblib.dump(feature_names, 'model/feature_names.pkl')
    
    # Save sample data for testing
    df.to_csv('data/synthetic_leads.csv', index=False)
    
    print("Model training completed!")
    print(f"Files saved:")
    print("- model/xgboost_model.pkl")
    print("- model/scaler.pkl")
    print("- model/label_encoders.pkl")
    print("- model/feature_names.pkl")
    print("- data/synthetic_leads.csv")
    
    return model, scaler, label_encoders, feature_names

if __name__ == "__main__":
    train_model() 