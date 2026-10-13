"""
Model Service for Telco Churn Prediction
Loads serialized models and preprocessor, runs inference, and generates actionable retention advice.
AWS Project Team 07
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List

class ModelService:
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_dir = os.path.join(base_dir, "saved_models")
        
        # Load artifacts
        print("Loading preprocessor and models...")
        self.preprocessor = joblib.load(os.path.join(self.model_dir, "preprocessor.joblib"))
        self.rf_model = joblib.load(os.path.join(self.model_dir, "rf_model.joblib"))
        self.xgb_model = joblib.load(os.path.join(self.model_dir, "xgb_model.joblib"))
        self.lr_model = joblib.load(os.path.join(self.model_dir, "lr_model.joblib"))
        
        with open(os.path.join(self.model_dir, "metadata.json"), "r", encoding="utf-8") as f:
            self.metadata = json.load(f)
            
        print("ModelService initialized successfully.")

    def get_metadata(self) -> Dict[str, Any]:
        return self.metadata

    def predict_single(self, customer_data: Dict[str, Any], model_type: str = "random_forest") -> Dict[str, Any]:
        """
        Run inference for a single customer payload.
        """
        # Ensure numerical values are correctly cast
        processed_input = dict(customer_data)
        processed_input["tenure"] = int(processed_input.get("tenure", 0))
        processed_input["MonthlyCharges"] = float(processed_input.get("MonthlyCharges", 0.0))
        
        # Handle TotalCharges if not provided or 0
        if "TotalCharges" not in processed_input or processed_input["TotalCharges"] is None or processed_input["TotalCharges"] == 0:
            if processed_input["tenure"] == 0:
                processed_input["TotalCharges"] = 0.0
            else:
                processed_input["TotalCharges"] = round(processed_input["tenure"] * processed_input["MonthlyCharges"], 2)
        else:
            processed_input["TotalCharges"] = float(processed_input["TotalCharges"])

        # Create DataFrame
        input_df = pd.DataFrame([processed_input])
        
        # Transform features
        X_proc = self.preprocessor.transform(input_df)
        
        # Select model
        selected_model = self.rf_model
        model_name = "SMOTE Random Forest"
        if model_type == "xgboost":
            selected_model = self.xgb_model
            model_name = "Balanced XGBoost"
        elif model_type == "logistic_regression":
            selected_model = self.lr_model
            model_name = "SMOTE Logistic Regression"
            
        # Inference
        probability = float(selected_model.predict_proba(X_proc)[0, 1])
        prediction = int(probability >= 0.5)
        
        # Risk categorization
        if probability >= 0.65:
            risk_level = "High"
            risk_color = "red"
        elif probability >= 0.35:
            risk_level = "Medium"
            risk_color = "amber"
        else:
            risk_level = "Low"
            risk_color = "green"

        # Generate intelligent business recommendations
        recommendations = self._generate_recommendations(processed_input, probability, risk_level)
        
        # Key risk factors
        risk_factors = self._identify_risk_factors(processed_input)

        return {
            "prediction": "Churn" if prediction == 1 else "Retained",
            "churn_probability": round(probability * 100, 2),
            "retention_probability": round((1.0 - probability) * 100, 2),
            "risk_level": risk_level,
            "risk_color": risk_color,
            "model_used": model_name,
            "risk_factors": risk_factors,
            "recommendations": recommendations,
            "customer_summary": {
                "tenure_months": processed_input["tenure"],
                "monthly_charges": processed_input["MonthlyCharges"],
                "total_charges": processed_input["TotalCharges"],
                "contract": processed_input.get("Contract", "Unknown"),
                "internet_service": processed_input.get("InternetService", "Unknown"),
                "payment_method": processed_input.get("PaymentMethod", "Unknown")
            }
        }

    def _identify_risk_factors(self, data: Dict[str, Any]) -> List[str]:
        factors = []
        if data.get("Contract") == "Month-to-month":
            factors.append("Month-to-month flexible contract (42% average churn rate)")
        if data.get("tenure", 0) <= 6:
            factors.append(f"Early tenure onboarding stage ({data.get('tenure')} months)")
        elif data.get("tenure", 0) <= 12:
            factors.append("First-year customer lifecycle (tenure under 12 months)")
            
        if data.get("InternetService") == "Fiber optic" and data.get("TechSupport") == "No":
            factors.append("Fiber Optic service without dedicated Technical Support")
            
        if data.get("PaymentMethod") == "Electronic check":
            factors.append("Payment via Electronic Check (highest churn correlation among billing methods)")
            
        if data.get("MonthlyCharges", 0) > 75.0:
            factors.append(f"High monthly charge burden (${data.get('MonthlyCharges'):.2f}/mo)")
            
        if data.get("OnlineSecurity") == "No" and data.get("InternetService") != "No":
            factors.append("No active Online Security suite")
            
        if not factors:
            factors.append("Customer exhibits stable loyalty indicators with minimal churn vulnerability")
            
        return factors

    def _generate_recommendations(self, data: Dict[str, Any], prob: float, risk_level: str) -> List[Dict[str, str]]:
        recs = []
        
        # 1. Contract Recommendation
        if data.get("Contract") == "Month-to-month":
            recs.append({
                "title": "Incentivize Annual Commitment",
                "action": "Offer a 15% discount or streaming bundle upgrade if customer upgrades to a 1-Year or 2-Year contract.",
                "expected_impact": "Reduces churn probability from ~42% to under 11%."
            })
            
        # 2. Tech Support & Internet
        if data.get("InternetService") == "Fiber optic" and data.get("TechSupport") == "No":
            recs.append({
                "title": "Provide Proactive Tech Support Onboarding",
                "action": "Offer 3 months of complimentary 24/7 Premium Tech Support and a remote router performance tune-up.",
                "expected_impact": "Cuts Fiber Optic churn vulnerability by approximately 30%."
            })
            
        # 3. Early Tenure Retention
        if data.get("tenure", 0) < 12:
            recs.append({
                "title": "Early Lifecycle Success Program",
                "action": "Schedule automated 30-day and 90-day check-in emails/calls to resolve early friction points.",
                "expected_impact": "Helps customer surpass the critical first-year churn spike."
            })
            
        # 4. Payment Method
        if data.get("PaymentMethod") == "Electronic check":
            recs.append({
                "title": "Migrate to Automated Payment",
                "action": "Provide a one-time $10 account credit for enrolling in Auto-pay (Credit Card or Bank Transfer).",
                "expected_impact": "Lowers payment friction and reduces involuntary/habitual churn."
            })
            
        # 5. Security & Backup Bundling
        if data.get("OnlineSecurity") == "No" and data.get("InternetService") != "No":
            recs.append({
                "title": "Add-On Value Security Protection",
                "action": "Offer complimentary Online Security trial for 60 days to enhance product stickiness.",
                "expected_impact": "Increases customer switching costs and satisfaction."
            })
            
        # Default recommendation if customer is already healthy
        if risk_level == "Low" and not recs:
            recs.append({
                "title": "Maintain Loyalty & Cross-Sell",
                "action": "Customer is highly satisfied. Enroll into VIP rewards program and explore family plan add-ons.",
                "expected_impact": "Sustains long-term retention (>95%) and increases Net Promoter Score."
            })
            
        return recs

# Singleton instance
model_service = ModelService()
