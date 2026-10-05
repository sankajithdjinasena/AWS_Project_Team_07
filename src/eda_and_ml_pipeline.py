"""
Telco Customer Churn - Data Science & ML Pipeline (XGBoost & SMOTE Models)
AWS Project Group 07

This script performs:
1. Data Loading & Data Quality Validation
2. Handling Data Quality Issues (missing TotalCharges values)
3. Exploratory Data Analysis & Visualizations (4 key figures)
4. Data Preprocessing & Class Balancing (SMOTE & scale_pos_weight)
5. Machine Learning Modeling (SMOTE Logistic Regression, SMOTE Random Forest & Balanced XGBoost)
6. Model Evaluation, Comparison & Feature Importance Analysis
7. Exporting Processed Dataset for AWS S3 / Athena SQL Analysis
"""

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, classification_report, confusion_matrix, roc_curve
)
from imblearn.over_sampling import SMOTE
import xgboost as xgb

# Set style for visualizations
sns.set_theme(style="whitegrid")
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'

# Create output directories
OS_OUTPUT_DIR = os.path.join("../output", "visualizations")
os.makedirs(OS_OUTPUT_DIR, exist_ok=True)
os.makedirs("data", exist_ok=True)

def load_and_validate_data(filepath="../data/Telco_Customer_Churn.csv"):
    print("=" * 60)
    print("STEP 1: DATA LOADING & QUALITY VALIDATION")
    print("=" * 60)
    
    df = pd.read_csv(filepath)
    print(f"Dataset Loaded Successfully! Total Rows: {df.shape[0]}, Total Columns: {df.shape[1]}")
    
    # Identify Data Quality Issue: TotalCharges string with spaces
    blank_total_charges = (df['TotalCharges'] == ' ').sum()
    print(f"Data Quality Issue Identified: Found {blank_total_charges} rows where 'TotalCharges' contains blank spaces ' '.")
    
    # Fix missing values in TotalCharges
    df['TotalCharges'] = df['TotalCharges'].replace(' ', np.nan).astype(float)
    
    # Impute missing TotalCharges with 0.0 for zero tenure rows
    df['TotalCharges'] = df['TotalCharges'].fillna(0.0)
    print("Fixed 'TotalCharges': Converted blank strings to float and imputed 0.0 for zero tenure rows.")
    
    print("\nDataset Summary Statistics:")
    print(df.describe())
    
    print("\nTarget Variable ('Churn') Distribution:")
    churn_counts = df['Churn'].value_counts()
    churn_pct = df['Churn'].value_counts(normalize=True) * 100
    for val in churn_counts.index:
        print(f"  {val}: {churn_counts[val]} ({churn_pct[val]:.2f}%)")
        
    return df

def generate_visualizations(df):
    print("\n" + "=" * 60)
    print("STEP 2: EXPLORATORY DATA ANALYSIS & VISUALIZATIONS")
    print("=" * 60)
    
    # Visualization 1: Churn Rate by Contract Type
    plt.figure(figsize=(8, 5))
    ax1 = sns.countplot(data=df, x='Contract', hue='Churn', palette=['#2ca02c', '#d62728'])
    plt.title('Customer Churn Distribution by Contract Type', fontsize=14, fontweight='bold', pad=15)
    plt.xlabel('Contract Type', fontsize=12)
    plt.ylabel('Customer Count', fontsize=12)
    for p in ax1.patches:
        height = p.get_height()
        if height > 0:
            ax1.annotate(f'{int(height)}', (p.get_x() + p.get_width() / 2., height / 2),
                         ha='center', va='center', fontsize=10, color='white', fontweight='bold')
    plt.tight_layout()
    fig1_path = os.path.join(OS_OUTPUT_DIR, "viz1_churn_by_contract.png")
    plt.savefig(fig1_path, dpi=300)
    plt.close()
    print(f"Saved Visualization 1 -> {fig1_path}")
    
    # Visualization 2: Tenure Distribution by Churn Status
    plt.figure(figsize=(9, 5))
    sns.kdeplot(data=df[df['Churn'] == 'No']['tenure'], label='Retained (No Churn)', color='#2ca02c', fill=True, alpha=0.4)
    sns.kdeplot(data=df[df['Churn'] == 'Yes']['tenure'], label='Churned (Yes)', color='#d62728', fill=True, alpha=0.4)
    plt.title('Tenure Density Distribution by Churn Status', fontsize=14, fontweight='bold', pad=15)
    plt.xlabel('Tenure (Months)', fontsize=12)
    plt.ylabel('Density', fontsize=12)
    plt.legend(title='Customer Status')
    plt.tight_layout()
    fig2_path = os.path.join(OS_OUTPUT_DIR, "viz2_tenure_density_by_churn.png")
    plt.savefig(fig2_path, dpi=300)
    plt.close()
    print(f"Saved Visualization 2 -> {fig2_path}")

    # Visualization 3: Monthly Charges Distribution by Churn Status
    plt.figure(figsize=(8, 5))
    sns.boxplot(data=df, x='Churn', y='MonthlyCharges', hue='Churn', palette=['#2ca02c', '#d62728'], legend=False)
    plt.title('Monthly Charges Breakdown by Churn Status', fontsize=14, fontweight='bold', pad=15)
    plt.xlabel('Churn Status', fontsize=12)
    plt.ylabel('Monthly Charges ($)', fontsize=12)
    plt.tight_layout()
    fig3_path = os.path.join(OS_OUTPUT_DIR, "viz3_monthly_charges_boxplot.png")
    plt.savefig(fig3_path, dpi=300)
    plt.close()
    print(f"Saved Visualization 3 -> {fig3_path}")

    # Visualization 4: Churn Rate by Internet Service and Tech Support
    plt.figure(figsize=(10, 5))
    sns.barplot(data=df, x='InternetService', y=(df['Churn'] == 'Yes').astype(int), hue='TechSupport', palette='Set2', errorbar=None)
    plt.title('Churn Rate by Internet Service & Tech Support Availability', fontsize=14, fontweight='bold', pad=15)
    plt.xlabel('Internet Service Provider Type', fontsize=12)
    plt.ylabel('Churn Rate (Ratio)', fontsize=12)
    plt.legend(title='Tech Support')
    plt.tight_layout()
    fig4_path = os.path.join(OS_OUTPUT_DIR, "viz4_internet_techsupport_churn.png")
    plt.savefig(fig4_path, dpi=300)
    plt.close()
    print(f"Saved Visualization 4 -> {fig4_path}")

def preprocess_and_train(df):
    print("\n" + "=" * 60)
    print("STEP 3: PREPROCESSING, BALANCING & MODEL TRAINING")
    print("=" * 60)
    
    # Copy dataset for ML
    data = df.copy()
    
    # Save clean dataset for S3 / Athena SQL analysis
    clean_csv_path = os.path.join("../data", "processed_telco_churn.csv")
    data.to_csv(clean_csv_path, index=False)
    print(f"Saved Clean Processed Dataset -> {clean_csv_path}")
    
    # Define Target and Features
    X = data.drop(columns=['customerID', 'Churn'])
    y = (data['Churn'] == 'Yes').astype(int)
    
    # Identify numerical and categorical columns
    num_cols = ['tenure', 'MonthlyCharges', 'TotalCharges']
    cat_cols = [c for c in X.columns if c not in num_cols]
    
    # Build Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_cols),
            ('cat', OneHotEncoder(drop='first', sparse_output=False), cat_cols)
        ]
    )
    
    # Train / Test Split (80/20 Stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    # Apply SMOTE to training data only
    smote = SMOTE(random_state=42)
    X_train_smote, y_train_smote = smote.fit_resample(X_train_proc, y_train)
    print(f"Original Training Shape: {X_train_proc.shape}, Churn counts: {y_train.value_counts().to_dict()}")
    print(f"SMOTE Resampled Training Shape: {X_train_smote.shape}, Churn counts: {pd.Series(y_train_smote).value_counts().to_dict()}")
    
    # Get feature names post one-hot encoding
    encoded_cat_names = preprocessor.named_transformers_['cat'].get_feature_names_out(cat_cols)
    all_feature_names = num_cols + list(encoded_cat_names)
    
    # Model 1: SMOTE + Logistic Regression
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    lr_model.fit(X_train_smote, y_train_smote)
    y_pred_lr = lr_model.predict(X_test_proc)
    y_prob_lr = lr_model.predict_proba(X_test_proc)[:, 1]
    
    # Model 2: SMOTE + Random Forest Classifier (Primary Champion Model)
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf_model.fit(X_train_smote, y_train_smote)
    y_pred_rf = rf_model.predict(X_test_proc)
    y_prob_rf = rf_model.predict_proba(X_test_proc)[:, 1]
    
    # Model 3: Balanced XGBoost Classifier (scale_pos_weight = 2.77)
    scale_pos = (y_train == 0).sum() / (y_train == 1).sum()
    xgb_model = xgb.XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.05, scale_pos_weight=scale_pos, random_state=42)
    xgb_model.fit(X_train_proc, y_train)
    y_pred_xgb = xgb_model.predict(X_test_proc)
    y_prob_xgb = xgb_model.predict_proba(X_test_proc)[:, 1]

    # Metrics Calculation
    results = {
        'SMOTE Logistic Regression': {
            'Accuracy': accuracy_score(y_test, y_pred_lr),
            'Precision': precision_score(y_test, y_pred_lr),
            'Recall': recall_score(y_test, y_pred_lr),
            'F1-Score': f1_score(y_test, y_pred_lr),
            'ROC-AUC': roc_auc_score(y_test, y_prob_lr)
        },
        'SMOTE Random Forest (Primary)': {
            'Accuracy': accuracy_score(y_test, y_pred_rf),
            'Precision': precision_score(y_test, y_pred_rf),
            'Recall': recall_score(y_test, y_pred_rf),
            'F1-Score': f1_score(y_test, y_pred_rf),
            'ROC-AUC': roc_auc_score(y_test, y_prob_rf)
        },
        'Balanced XGBoost (High Recall)': {
            'Accuracy': accuracy_score(y_test, y_pred_xgb),
            'Precision': precision_score(y_test, y_pred_xgb),
            'Recall': recall_score(y_test, y_pred_xgb),
            'F1-Score': f1_score(y_test, y_pred_xgb),
            'ROC-AUC': roc_auc_score(y_test, y_prob_xgb)
        }
    }
    
    metrics_df = pd.DataFrame(results).T
    print("\n" + "-" * 50)
    print("MODEL PERFORMANCE COMPARISON METRICS:")
    print("-" * 50)
    print(metrics_df.to_string())
    
    # Save Metrics to file
    metrics_path = os.path.join(OS_OUTPUT_DIR, "model_comparison_metrics.csv")
    metrics_df.to_csv(metrics_path)
    print(f"\nSaved Metrics Comparison -> {metrics_path}")
    
    # Feature Importance for Random Forest
    rf_importances = pd.Series(rf_model.feature_importances_, index=all_feature_names).sort_values(ascending=False)
    print("\n" + "-" * 50)
    print("TOP 10 MOST IMPORTANT FEATURES (SMOTE Random Forest):")
    print("-" * 50)
    print(rf_importances.head(10).to_string())
    
    # Plot Top 10 Feature Importances
    plt.figure(figsize=(9, 5))
    rf_importances.head(10).plot(kind='barh', color='#1f77b4').invert_yaxis()
    plt.title('Top 10 Customer Churn Predictors (Feature Importance)', fontsize=14, fontweight='bold', pad=15)
    plt.xlabel('Relative Feature Importance Score', fontsize=12)
    plt.tight_layout()
    fig5_path = os.path.join(OS_OUTPUT_DIR, "viz5_feature_importance.png")
    plt.savefig(fig5_path, dpi=300)
    plt.close()
    print(f"Saved Feature Importance Chart -> {fig5_path}")

    return metrics_df

if __name__ == "__main__":
    raw_df = load_and_validate_data()
    generate_visualizations(raw_df)
    preprocess_and_train(raw_df)
    print("\nPipeline Execution Completed Successfully!")
