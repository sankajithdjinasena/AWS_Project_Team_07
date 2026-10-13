"""
FastAPI Backend for Telco Customer Churn Prediction Solution
AWS Project Team 07
"""

from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import io
import os
import pandas as pd
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
try:
    from backend.model_service import model_service
except ImportError:
    from model_service import model_service

app = FastAPI(
    title="AWS Telco Customer Churn Prediction API",
    description="Production-ready FastAPI service powering ML churn classification models with automated retention insights.",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite defaults to 5173, also permit all origins for flexibility)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CustomerPayload(BaseModel):
    gender: str = Field(default="Female", description="Gender: Female, Male")
    SeniorCitizen: int = Field(default=0, description="Senior Citizen: 0 or 1")
    Partner: str = Field(default="No", description="Partner: Yes, No")
    Dependents: str = Field(default="No", description="Dependents: Yes, No")
    tenure: int = Field(default=12, ge=0, le=100, description="Tenure in months")
    PhoneService: str = Field(default="Yes", description="Phone Service: Yes, No")
    MultipleLines: str = Field(default="No", description="Multiple Lines: Yes, No, No phone service")
    InternetService: str = Field(default="Fiber optic", description="Internet: DSL, Fiber optic, No")
    OnlineSecurity: str = Field(default="No", description="Online Security: Yes, No, No internet service")
    OnlineBackup: str = Field(default="No", description="Online Backup: Yes, No, No internet service")
    DeviceProtection: str = Field(default="No", description="Device Protection: Yes, No, No internet service")
    TechSupport: str = Field(default="No", description="Tech Support: Yes, No, No internet service")
    StreamingTV: str = Field(default="No", description="Streaming TV: Yes, No, No internet service")
    StreamingMovies: str = Field(default="No", description="Streaming Movies: Yes, No, No internet service")
    Contract: str = Field(default="Month-to-month", description="Contract: Month-to-month, One year, Two year")
    PaperlessBilling: str = Field(default="Yes", description="Paperless Billing: Yes, No")
    PaymentMethod: str = Field(default="Electronic check", description="Payment Method: Electronic check, Mailed check, Bank transfer (automatic), Credit card (automatic)")
    MonthlyCharges: float = Field(default=75.0, ge=0.0, description="Monthly Charges ($)")
    TotalCharges: Optional[float] = Field(default=None, ge=0.0, description="Total Charges ($) or None to auto-compute")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AWS Telco Churn Prediction API",
        "team": "Team 07",
        "version": "1.0.0"
    }

@app.get("/api/s3/status")
def get_s3_status(bucket: Optional[str] = None):
    """Returns AWS S3 connection state, target bucket, and churn_model.pkl availability."""
    try:
        from backend.s3_service import s3_service
    except ImportError:
        from s3_service import s3_service
    return s3_service.get_status(bucket=bucket)

@app.post("/api/s3/upload")
def upload_model_to_s3(bucket: Optional[str] = None):
    """Uploads the local churn_model.pkl to the configured AWS S3 bucket."""
    try:
        from backend.s3_service import s3_service
    except ImportError:
        from s3_service import s3_service
    return s3_service.upload_model(local_path=model_service.pickle_path, bucket=bucket)

@app.post("/api/s3/sync")
def sync_model_from_s3(bucket: Optional[str] = None):
    """Downloads and reloads churn_model.pkl from the AWS S3 bucket."""
    return model_service.sync_from_s3(bucket=bucket)

@app.get("/api/model-info")
def get_model_info():
    """Returns training metadata, feature columns, and categorical options."""
    return model_service.get_metadata()

@app.get("/api/metrics")
def get_metrics():
    """Returns model evaluation comparison and top feature importances."""
    metadata = model_service.get_metadata()
    return {
        "models": metadata.get("metrics", {}),
        "feature_importances": metadata.get("feature_importances", []),
        "sample_counts": {
            "train": metadata.get("train_samples"),
            "test": metadata.get("test_samples"),
            "smote_train": metadata.get("smote_train_samples"),
            "baseline_churn_rate": metadata.get("baseline_churn_rate")
        }
    }

@app.get("/api/sample-profiles")
def get_sample_profiles():
    """Returns preset customer profiles for 1-click testing in the UI."""
    return [
        {
            "id": "high_risk",
            "name": "High Risk: New Fiber Optic Customer",
            "tag": "High Risk",
            "color": "red",
            "description": "Short tenure, month-to-month contract, fiber optic without tech support, and electronic check payment.",
            "data": {
                "gender": "Female",
                "SeniorCitizen": 0,
                "Partner": "No",
                "Dependents": "No",
                "tenure": 2,
                "PhoneService": "Yes",
                "MultipleLines": "No",
                "InternetService": "Fiber optic",
                "OnlineSecurity": "No",
                "OnlineBackup": "No",
                "DeviceProtection": "No",
                "TechSupport": "No",
                "StreamingTV": "Yes",
                "StreamingMovies": "No",
                "Contract": "Month-to-month",
                "PaperlessBilling": "Yes",
                "PaymentMethod": "Electronic check",
                "MonthlyCharges": 85.50,
                "TotalCharges": 171.00
            }
        },
        {
            "id": "loyal_customer",
            "name": "Low Risk: Long-Term Enterprise/Loyal Family",
            "tag": "Low Risk",
            "color": "green",
            "description": "65 months tenure, 2-year contract, full security & tech support bundle, auto-bank payment.",
            "data": {
                "gender": "Male",
                "SeniorCitizen": 0,
                "Partner": "Yes",
                "Dependents": "Yes",
                "tenure": 65,
                "PhoneService": "Yes",
                "MultipleLines": "Yes",
                "InternetService": "DSL",
                "OnlineSecurity": "Yes",
                "OnlineBackup": "Yes",
                "DeviceProtection": "Yes",
                "TechSupport": "Yes",
                "StreamingTV": "No",
                "StreamingMovies": "No",
                "Contract": "Two year",
                "PaperlessBilling": "No",
                "PaymentMethod": "Bank transfer (automatic)",
                "MonthlyCharges": 54.20,
                "TotalCharges": 3523.00
            }
        },
        {
            "id": "moderate_risk",
            "name": "Moderate Risk: Entertainment Streamer",
            "tag": "Medium Risk",
            "color": "amber",
            "description": "15 months tenure, month-to-month contract, streaming packages with moderate bills.",
            "data": {
                "gender": "Female",
                "SeniorCitizen": 1,
                "Partner": "No",
                "Dependents": "No",
                "tenure": 15,
                "PhoneService": "Yes",
                "MultipleLines": "Yes",
                "InternetService": "Fiber optic",
                "OnlineSecurity": "No",
                "OnlineBackup": "Yes",
                "DeviceProtection": "Yes",
                "TechSupport": "No",
                "StreamingTV": "Yes",
                "StreamingMovies": "Yes",
                "Contract": "Month-to-month",
                "PaperlessBilling": "Yes",
                "PaymentMethod": "Electronic check",
                "MonthlyCharges": 98.60,
                "TotalCharges": 1479.00
            }
        },
        {
            "id": "budget_customer",
            "name": "Budget Value Customer (One-Year)",
            "tag": "Low Risk",
            "color": "blue",
            "description": "Tenure 36 months, 1-year contract, basic phone + DSL, credit card automatic payment.",
            "data": {
                "gender": "Male",
                "SeniorCitizen": 0,
                "Partner": "Yes",
                "Dependents": "No",
                "tenure": 36,
                "PhoneService": "Yes",
                "MultipleLines": "No",
                "InternetService": "DSL",
                "OnlineSecurity": "Yes",
                "OnlineBackup": "No",
                "DeviceProtection": "No",
                "TechSupport": "Yes",
                "StreamingTV": "No",
                "StreamingMovies": "No",
                "Contract": "One year",
                "PaperlessBilling": "No",
                "PaymentMethod": "Credit card (automatic)",
                "MonthlyCharges": 42.15,
                "TotalCharges": 1517.40
            }
        }
    ]

@app.post("/api/predict")
def predict_churn(
    payload: CustomerPayload,
    model_type: str = Query("random_forest", enum=["random_forest", "xgboost", "logistic_regression", "s3_pickle"])
):
    """
    Predicts churn status and probability for a customer profile.
    """
    try:
        result = model_service.predict_single(payload.dict(), model_type=model_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/api/sample-csv")
def get_sample_csv():
    """Returns sample 20 rows of Telco Customer CSV for 1-click batch testing."""
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "Telco_Customer_Churn.csv"))
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        sample_csv = df.head(20).to_csv(index=False)
        from fastapi.responses import Response
        return Response(
            content=sample_csv,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=telco_sample_batch.csv"}
        )
    raise HTTPException(status_code=404, detail="Dataset not found")

@app.post("/api/batch-predict")
async def batch_predict(
    file: UploadFile = File(...),
    model_type: str = Query("random_forest", enum=["random_forest", "xgboost", "logistic_regression", "s3_pickle"])
):
    """
    Upload a CSV file containing customer rows to get batch churn predictions.
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Process and predict for up to 100 rows for real-time responsiveness
        records = df.head(100).to_dict(orient="records")
        results = []
        for row in records:
            pred = model_service.predict_single(row, model_type=model_type)
            results.append({
                "customerID": row.get("customerID", f"CUST-{len(results)+1}"),
                "churn_prediction": pred["prediction"],
                "churn_probability": pred["churn_probability"],
                "risk_level": pred["risk_level"],
                "contract": row.get("Contract"),
                "tenure": row.get("tenure"),
                "monthly_charges": row.get("MonthlyCharges")
            })
            
        summary = {
            "total_processed": len(results),
            "predicted_churn": sum(1 for r in results if r["churn_prediction"] == "Churn"),
            "predicted_retained": sum(1 for r in results if r["churn_prediction"] == "Retained"),
            "high_risk_count": sum(1 for r in results if r["risk_level"] == "High"),
            "medium_risk_count": sum(1 for r in results if r["risk_level"] == "Medium"),
            "low_risk_count": sum(1 for r in results if r["risk_level"] == "Low"),
        }
        
        return {
            "summary": summary,
            "predictions": results
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV file: {str(e)}")

# Mount and serve built React frontend if distribution files exist
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api") or full_path in ["docs", "openapi.json", "redoc"]:
            raise HTTPException(status_code=404, detail="Not Found")
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

