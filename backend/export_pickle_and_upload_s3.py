"""
Export Telco Churn ML Pipeline as a Pickle (.pkl) file and Upload to AWS S3.
AWS Project Team 07
"""

import os
import sys
import argparse
import pickle
import pandas as pd
import numpy as np

from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import SMOTE

# Add project root to sys.path
base_dir = os.path.dirname(os.path.abspath(__file__))
if base_dir not in sys.path:
    sys.path.append(base_dir)

from s3_service import s3_service

def build_and_export_pickle(output_path="saved_models/churn_model.pkl"):
    print("=" * 65)
    print("STEP 1: TRAINING CHAMPION PIPELINE & EXPORTING PICKLE (.pkl)")
    print("=" * 65)
    
    # Locate dataset
    data_path = os.path.join(base_dir, "..", "data", "Telco_Customer_Churn.csv")
    if not os.path.exists(data_path):
        data_path = os.path.join(base_dir, "data", "Telco_Customer_Churn.csv")
        
    print(f"Loading raw dataset: {data_path}")
    df = pd.read_csv(data_path)
    
    # Data Quality fix: whitespace in TotalCharges
    df['TotalCharges'] = df['TotalCharges'].replace(' ', 0.0).astype(float).fillna(0.0)
    
    X = df.drop(columns=['customerID', 'Churn'])
    y = (df['Churn'] == 'Yes').astype(int)
    
    num_cols = ['tenure', 'MonthlyCharges', 'TotalCharges']
    cat_cols = [c for c in X.columns if c not in num_cols]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_cols),
            ('cat', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'), cat_cols)
        ]
    )
    
    # Train / Test split matching FastAPI model training exactly (80/20 Stratified)
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    # Preprocess & balance with SMOTE
    print("Applying ColumnTransformer and SMOTE class balancing (80/20 stratified split)...")
    X_train_proc = preprocessor.fit_transform(X_train)
    smote = SMOTE(random_state=42)
    X_train_smote, y_train_smote = smote.fit_resample(X_train_proc, y_train)
    
    # Train champion Random Forest model
    print(f"Training Champion Random Forest on {len(X_train_smote)} SMOTE-balanced samples...")
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf_model.fit(X_train_smote, y_train_smote)
    
    # Wrap preprocessor and trained classifier into a unified Pipeline
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', rf_model)
    ])
    
    # Ensure directory exists
    full_output_path = os.path.join(base_dir, output_path)
    os.makedirs(os.path.dirname(full_output_path), exist_ok=True)
    
    # Save as .pkl
    print(f"Saving unified pipeline to pickle file: {full_output_path}")
    with open(full_output_path, 'wb') as f:
        pickle.dump(pipeline, f, protocol=pickle.HIGHEST_PROTOCOL)
        
    file_size_mb = os.path.getsize(full_output_path) / (1024 * 1024)
    print(f"[OK] Pickle file created successfully! Size: {file_size_mb:.2f} MB")
    
    # Verify unpickling & prediction
    with open(full_output_path, 'rb') as f:
        test_pipeline = pickle.load(f)
    sample_pred = test_pipeline.predict_proba(X.iloc[[0]])[0, 1]
    print(f"[OK] Pickle test validation passed! Sample Churn Probability: {sample_pred*100:.2f}%\n")
    
    return full_output_path

def upload_to_s3(local_path, bucket_name=None, key="models/churn_model.pkl"):
    print("=" * 65)
    print("STEP 2: UPLOADING PICKLE FILE TO AWS S3 BUCKET")
    print("=" * 65)
    bucket = bucket_name or s3_service.bucket_name
    print(f"Target: s3://{bucket}/{key}")
    
    result = s3_service.upload_model(local_path=local_path, key=key, bucket=bucket)
    if result["success"]:
        print(f"[SUCCESS] {result['message']}")
        print(f"URI: {result['s3_uri']}")
    else:
        print(f"[INFO] Upload status: {result['message']}")
        print("To configure AWS credentials on your machine:")
        print("  1. Run 'aws configure' (if AWS CLI is installed), OR")
        print("  2. Set environment variables:")
        print("     $env:AWS_ACCESS_KEY_ID = 'your_key'")
        print("     $env:AWS_SECRET_ACCESS_KEY = 'your_secret'")
        print("     $env:AWS_DEFAULT_REGION = 'us-east-1'")
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export and Upload Churn Pickle Model to AWS S3")
    parser.add_argument("--bucket", default=s3_service.bucket_name, help="AWS S3 bucket name")
    parser.add_argument("--key", default="models/churn_model.pkl", help="S3 object key")
    parser.add_argument("--upload", action="store_true", help="Upload to AWS S3 after export")
    
    args = parser.parse_args()
    
    pickle_file = build_and_export_pickle()
    
    if args.upload:
        upload_to_s3(pickle_file, bucket_name=args.bucket, key=args.key)
    else:
        print("To upload this pickle file to S3, run:")
        print(f"  python backend/export_pickle_and_upload_s3.py --upload --bucket {args.bucket}")
