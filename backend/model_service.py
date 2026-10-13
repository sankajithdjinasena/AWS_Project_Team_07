"""
Model Service for Telco Churn Prediction
Loads serialized pickle models and preprocessor, synchronizes with AWS S3,
runs inference, and generates actionable retention advice.
AWS Project Team 07
"""

import os
import json
import joblib
import pickle
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
try:
    from backend.s3_service import s3_service
except ImportError:
    from s3_service import s3_service

class ModelService:
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_dir = os.path.join(base_dir, "saved_models")
        self.pickle_path = os.path.join(self.model_dir, "churn_model.pkl")
        self.model_source = "Local Pickle Cache (churn_model.pkl)"
        self.s3_synced = False
        
        # 1. Load artifacts
        print("Loading preprocessor and models...")
        self.preprocessor = joblib.load(os.path.join(self.model_dir, "preprocessor.joblib"))
        self.rf_model = joblib.load(os.path.join(self.model_dir, "rf_model.joblib"))
        self.xgb_model = joblib.load(os.path.join(self.model_dir, "xgb_model.joblib"))
        self.lr_model = joblib.load(os.path.join(self.model_dir, "lr_model.joblib"))
        
        # 2. Load Pickle Pipeline if available
        self.pickle_pipeline = None
        if os.path.exists(self.pickle_path):
            try:
                with open(self.pickle_path, "rb") as f:
                    self.pickle_pipeline = pickle.load(f)
                print(f"Loaded unified pickle model from: {self.pickle_path}")
            except Exception as e:
                print(f"Warning loading pickle pipeline: {e}")
        
        # 3. Load Metadata
        with open(os.path.join(self.model_dir, "metadata.json"), "r", encoding="utf-8") as f:
            self.metadata = json.load(f)
            
        print("ModelService initialized successfully.")

    def sync_from_s3(self, bucket: Optional[str] = None, key: str = "models/churn_model.pkl") -> Dict[str, Any]:
        """Attempts to download the newest pickle file from AWS S3 and reload it into memory."""
        res = s3_service.download_model(local_path=self.pickle_path, key=key, bucket=bucket)
        if res.get("success"):
            try:
                with open(self.pickle_path, "rb") as f:
                    self.pickle_pipeline = pickle.load(f)
                self.model_source = f"AWS S3 ({res['s3_uri']})"
                self.s3_synced = True
                return {
                    "success": True,
                    "message": f"Successfully synced and reloaded pickle model from {res['s3_uri']}",
                    "model_source": self.model_source
                }
            except Exception as e:
                return {"success": False, "message": f"Error deserializing model from S3: {str(e)}"}
        return res

    def get_metadata(self) -> Dict[str, Any]:
        meta = dict(self.metadata)
        s3_stat = s3_service.get_status()
        meta["model_storage"] = {
            "pickle_path": self.pickle_path,
            "pickle_size_bytes": os.path.getsize(self.pickle_path) if os.path.exists(self.pickle_path) else 0,
            "pickle_size_mb": round(os.path.getsize(self.pickle_path) / (1024 * 1024), 2) if os.path.exists(self.pickle_path) else 0,
            "model_source": self.model_source,
            "s3_bucket": s3_service.bucket_name,
            "s3_key": "models/churn_model.pkl",
            "s3_uri": f"s3://{s3_service.bucket_name}/models/churn_model.pkl",
            "s3_connected": s3_stat.get("connected", False),
            "s3_exists": s3_stat.get("exists_in_s3", False),
            "s3_details": s3_stat
        }
        return meta

    def predict_single(self, customer_data: Dict[str, Any], model_type: str = "random_forest") -> Dict[str, Any]:
        """
        Run inference for a single customer payload.
        """
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
        
        # Inference using S3 Pickle Pipeline or FastAPI Native Models
        if model_type in ["s3_pickle", "pickle_pipeline"]:
            if self.pickle_pipeline is not None:
                probability = float(self.pickle_pipeline.predict_proba(input_df)[0, 1])
                model_name = "AWS S3 Pickle Model (churn_model.pkl)"
            else:
                X_proc = self.preprocessor.transform(input_df)
                probability = float(self.rf_model.predict_proba(X_proc)[0, 1])
                model_name = "FastAPI Local Random Forest (Fallback)"
        elif model_type == "xgboost":
            X_proc = self.preprocessor.transform(input_df)
            probability = float(self.xgb_model.predict_proba(X_proc)[0, 1])
            model_name = "FastAPI Balanced XGBoost"
        elif model_type == "logistic_regression":
            X_proc = self.preprocessor.transform(input_df)
            probability = float(self.lr_model.predict_proba(X_proc)[0, 1])
            model_name = "FastAPI SMOTE Logistic Regression"
        else:  # "random_forest"
            X_proc = self.preprocessor.transform(input_df)
            probability = float(self.rf_model.predict_proba(X_proc)[0, 1])
            model_name = "FastAPI SMOTE Random Forest"

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

        recommendations = self._generate_recommendations(processed_input, probability, risk_level)
        risk_factors = self._identify_risk_factors(processed_input)

        return {
            "prediction": "Churn" if prediction == 1 else "Retained",
            "churn_probability": round(probability * 100, 2),
            "retention_probability": round((1.0 - probability) * 100, 2),
            "risk_level": risk_level,
            "risk_color": risk_color,
            "model_used": model_name,
            "model_source": self.model_source,
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
        if data.get("Contract") == "Month-to-month":
            recs.append({
                "title": "Incentivize Annual Commitment",
                "action": "Offer a 15% discount or streaming bundle upgrade if customer upgrades to a 1-Year or 2-Year contract.",
                "expected_impact": "Reduces churn probability from ~42% to under 11%."
            })
            
        if data.get("InternetService") == "Fiber optic" and data.get("TechSupport") == "No":
            recs.append({
                "title": "Provide Proactive Tech Support Onboarding",
                "action": "Offer 3 months of complimentary 24/7 Premium Tech Support and a remote router performance tune-up.",
                "expected_impact": "Cuts Fiber Optic churn vulnerability by approximately 30%."
            })
            
        if data.get("tenure", 0) < 12:
            recs.append({
                "title": "Early Lifecycle Success Program",
                "action": "Schedule automated 30-day and 90-day check-in emails/calls to resolve early friction points.",
                "expected_impact": "Helps customer surpass the critical first-year churn spike."
            })
            
        if data.get("PaymentMethod") == "Electronic check":
            recs.append({
                "title": "Migrate to Automated Payment",
                "action": "Provide a one-time $10 account credit for enrolling in Auto-pay (Credit Card or Bank Transfer).",
                "expected_impact": "Lowers payment friction and reduces involuntary/habitual churn."
            })
            
        if data.get("OnlineSecurity") == "No" and data.get("InternetService") != "No":
            recs.append({
                "title": "Add-On Value Security Protection",
                "action": "Offer complimentary Online Security trial for 60 days to enhance product stickiness.",
                "expected_impact": "Increases customer switching costs and satisfaction."
            })
            
        if risk_level == "Low" and not recs:
            recs.append({
                "title": "Maintain Loyalty & Cross-Sell",
                "action": "Customer is highly satisfied. Enroll into VIP rewards program and explore family plan add-ons.",
                "expected_impact": "Sustains long-term retention (>95%) and increases Net Promoter Score."
            })
            
        return recs

# Singleton instance
model_service = ModelService()
