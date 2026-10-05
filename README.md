# AWS-Based Data Science Solution: Telco Customer Churn Analytics (Group 07)

[![AWS Services](https://img.shields.io/badge/AWS-S3%20%7C%20Lambda%20%7C%20Glue%20%7C%20Athena-orange.svg)](https://aws.amazon.com/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML-green.svg)](https://scikit-learn.org/)

This repository contains the complete cloud-based Data Science and Machine Learning solution for the **AWS Customer Churn Prediction and Analytics Project** (Group 07).

---

## 📁 Repository Directory Structure

```text
AWS_Project_Team_07/
├── AWS Assignment.pdf                 # Original Assignment Requirements PDF
├── README.md                          # GitHub Repository Documentation
├── data/
│   ├── Telco_Customer_Churn.csv       # Original Dataset (7,043 rows)
│   └── processed_telco_churn.csv      # Cleaned Dataset for S3 / AWS Athena
├── src/
│   ├── lambda_function.py             # AWS Lambda Automated Validator & CloudWatch Logging
│   ├── eda_and_ml_pipeline.py         # Complete Data Science EDA, Models & Visualizations
│   └── sql_queries.sql                # 5 AWS Athena Analytical SQL Queries
├── infrastructure/
│   └── cloudformation_template.yaml   # CloudFormation Infrastructure as Code (IaC)
├── notebooks/
│   └── eda_and_ml_pipeline.ipynb     # Data Science Jupyter Notebook (Group 07)
├── Images/
│   └── Architecture.jpg               # AWS System Architecture Diagram
├── output/
│   └── visualizations/                # Generated EDA & Feature Importance Plot PNGs
│       ├── model_comparison_metrics.csv
│       ├── viz1_churn_by_contract.png
│       ├── viz2_tenure_density_by_churn.png
│       ├── viz3_monthly_charges_boxplot.png
│       ├── viz4_internet_techsupport_churn.png
│       └── viz5_feature_importance.png
└── docs/
    ├── Technical_Report_Draft.md      # Complete 6-8 Page Technical Report Draft
    └── group_demonstration_script.md  # Video Demonstration & Slide Script Outline
```

---

## ⚡ Quick Start & How to Run

### 1. Run Data Science Pipeline Locally or via Notebook
```bash
python src/eda_and_ml_pipeline.py
```
*Outputs clean dataset `data/processed_telco_churn.csv` and 5 visualization charts in `output/visualizations/`.*

### 2. Deploy AWS Infrastructure via CloudFormation
```bash
aws cloudformation create-stack \
  --stack-name telco-churn-stack \
  --template-body file://infrastructure/cloudformation_template.yaml \
  --capabilities CAPABILITY_NAMED_IAM
```

### 3. Deploy AWS Lambda Validation Trigger
Copy code from `src/lambda_function.py` into AWS Lambda console (`TelcoDatasetValidator`) and attach `s3:ObjectCreated:*` trigger on `s3://telecom-churn-analytics-team07/raw/`.

### 4. Execute Athena SQL Queries
Load `src/sql_queries.sql` in AWS Athena console connected to Glue Database `telco_churn_db`.

---

## 👥 Individual Contribution Table

*Individual contribution table to be updated by Group 07.*
