"""
Train and export Machine Learning models and preprocessing pipeline for Telco Churn Prediction.
AWS Project Team 07
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from imblearn.over_sampling import SMOTE
import xgboost as xgb

def train_and_export():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(base_dir, "saved_models")
    os.makedirs(model_dir, exist_ok=True)
    
    # Locate dataset
    data_path = os.path.join(base_dir, "..", "data", "Telco_Customer_Churn.csv")
    if not os.path.exists(data_path):
        data_path = os.path.join(base_dir, "data", "Telco_Customer_Churn.csv")
    
    print(f"Loading data from: {data_path}")
    df = pd.read_csv(data_path)
    
    # Data Cleaning: Handle whitespace in TotalCharges
    df['TotalCharges'] = df['TotalCharges'].replace(' ', np.nan).astype(float)
    df['TotalCharges'] = df['TotalCharges'].fillna(0.0)
    
    # Features and target
    X = df.drop(columns=['customerID', 'Churn'])
    y = (df['Churn'] == 'Yes').astype(int)
    
    num_cols = ['tenure', 'MonthlyCharges', 'TotalCharges']
    cat_cols = [c for c in X.columns if c not in num_cols]
    
    # Preprocessor definition
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_cols),
            ('cat', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'), cat_cols)
        ]
    )
    
    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    # Fit preprocessor
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    # Apply SMOTE to training set for balanced training
    smote = SMOTE(random_state=42)
    X_train_smote, y_train_smote = smote.fit_resample(X_train_proc, y_train)
    
    # Model 1: SMOTE + Random Forest (Champion)
    print("Training SMOTE Random Forest...")
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf_model.fit(X_train_smote, y_train_smote)
    y_pred_rf = rf_model.predict(X_test_proc)
    y_prob_rf = rf_model.predict_proba(X_test_proc)[:, 1]
    
    # Model 2: Balanced XGBoost (High Recall)
    print("Training Balanced XGBoost...")
    scale_pos = float((y_train == 0).sum() / (y_train == 1).sum())
    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        scale_pos_weight=scale_pos,
        random_state=42,
        eval_metric='logloss'
    )
    xgb_model.fit(X_train_proc, y_train)
    y_pred_xgb = xgb_model.predict(X_test_proc)
    y_prob_xgb = xgb_model.predict_proba(X_test_proc)[:, 1]
    
    # Model 3: SMOTE + Logistic Regression
    print("Training SMOTE Logistic Regression...")
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    lr_model.fit(X_train_smote, y_train_smote)
    y_pred_lr = lr_model.predict(X_test_proc)
    y_prob_lr = lr_model.predict_proba(X_test_proc)[:, 1]
    
    # Compute Metrics
    metrics = {
        "random_forest": {
            "name": "SMOTE Random Forest (Primary Champion)",
            "accuracy": round(float(accuracy_score(y_test, y_pred_rf)), 4),
            "precision": round(float(precision_score(y_test, y_pred_rf)), 4),
            "recall": round(float(recall_score(y_test, y_pred_rf)), 4),
            "f1": round(float(f1_score(y_test, y_pred_rf)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, y_prob_rf)), 4)
        },
        "xgboost": {
            "name": "Balanced XGBoost (High Recall)",
            "accuracy": round(float(accuracy_score(y_test, y_pred_xgb)), 4),
            "precision": round(float(precision_score(y_test, y_pred_xgb)), 4),
            "recall": round(float(recall_score(y_test, y_pred_xgb)), 4),
            "f1": round(float(f1_score(y_test, y_pred_xgb)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, y_prob_xgb)), 4)
        },
        "logistic_regression": {
            "name": "SMOTE Logistic Regression (Baseline)",
            "accuracy": round(float(accuracy_score(y_test, y_pred_lr)), 4),
            "precision": round(float(precision_score(y_test, y_pred_lr)), 4),
            "recall": round(float(recall_score(y_test, y_pred_lr)), 4),
            "f1": round(float(f1_score(y_test, y_pred_lr)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, y_prob_lr)), 4)
        }
    }
    
    # Extract feature names & Feature Importances from RF
    encoded_cat_names = preprocessor.named_transformers_['cat'].get_feature_names_out(cat_cols)
    all_feature_names = num_cols + list(encoded_cat_names)
    importances = rf_model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    feature_importances = [
        {"feature": all_feature_names[i], "importance": round(float(importances[i]), 4)}
        for i in sorted_idx[:15]
    ]
    
    # Categorical options mapping for frontend form dropdowns
    categorical_options = {}
    for col in cat_cols:
        categorical_options[col] = sorted(df[col].dropna().unique().tolist())
    
    metadata = {
        "num_cols": num_cols,
        "cat_cols": cat_cols,
        "all_feature_names": all_feature_names,
        "metrics": metrics,
        "feature_importances": feature_importances,
        "categorical_options": categorical_options,
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "smote_train_samples": int(len(X_train_smote)),
        "baseline_churn_rate": round(float(y.mean() * 100), 2)
    }
    
    # Save artifacts
    print("Saving preprocessor and models to disk...")
    joblib.dump(preprocessor, os.path.join(model_dir, "preprocessor.joblib"))
    joblib.dump(rf_model, os.path.join(model_dir, "rf_model.joblib"))
    joblib.dump(xgb_model, os.path.join(model_dir, "xgb_model.joblib"))
    joblib.dump(lr_model, os.path.join(model_dir, "lr_model.joblib"))
    
    # Save unified S3 Pickle pipeline with EXACT same preprocessor and rf_model
    from sklearn.pipeline import Pipeline
    import pickle
    unified_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', rf_model)
    ])
    pickle_path = os.path.join(model_dir, "churn_model.pkl")
    with open(pickle_path, "wb") as f:
        pickle.dump(unified_pipeline, f, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"Saved unified churn_model.pkl -> {pickle_path} (100% aligned with FastAPI models)")

    with open(os.path.join(model_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    print("All models, pickle pipeline, and metadata successfully exported!")

if __name__ == "__main__":
    train_and_export()
