-- =============================================================================
-- AWS Athena Analytical SQL Queries
-- Dataset: Telco Customer Churn (Processed Data in S3 / Glue Catalog)
-- AWS Project Group 07
-- =============================================================================

-- Database & Table Creation (Glue Catalog / Athena)
CREATE DATABASE IF NOT EXISTS telco_churn_db;

CREATE EXTERNAL TABLE IF NOT EXISTS telco_churn_db.processed_churn (
    customerID STRING,
    gender STRING,
    SeniorCitizen INT,
    Partner STRING,
    Dependents STRING,
    tenure INT,
    PhoneService STRING,
    MultipleLines STRING,
    InternetService STRING,
    OnlineSecurity STRING,
    OnlineBackup STRING,
    DeviceProtection STRING,
    TechSupport STRING,
    StreamingTV STRING,
    StreamingMovies STRING,
    Contract STRING,
    PaperlessBilling STRING,
    PaymentMethod STRING,
    MonthlyCharges DOUBLE,
    TotalCharges DOUBLE,
    Churn STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION 's3://telecom-churn-analytics-team07/processed/'
TBLPROPERTIES ('skip.header.line.count'='1');


-- -----------------------------------------------------------------------------
-- QUERY 1: Overall Customer Churn Summary & Revenue Impact
-- Purpose: Calculate overall customer churn count, churn rate %, and lost monthly revenue.
-- -----------------------------------------------------------------------------
    SELECT 
        COUNT(*) AS total_customers,
        SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS churned_customers,
        ROUND(100.0 * SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) AS churn_rate_percentage,
        ROUND(SUM(CASE WHEN Churn = 'Yes' THEN MonthlyCharges ELSE 0 END), 2) AS monthly_revenue_lost
    FROM telco_churn_db.processed_churn;


-- -----------------------------------------------------------------------------
-- QUERY 2: Churn Breakdown by Contract Type & Payment Method
-- Purpose: Evaluate how contractual terms and billing methods influence churn rates.
-- -----------------------------------------------------------------------------
SELECT 
    Contract,
    PaymentMethod,
    COUNT(*) AS customer_count,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS churned_count,
    ROUND(100.0 * SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) AS churn_rate_pct,
    ROUND(AVG(MonthlyCharges), 2) AS avg_monthly_charge
FROM telco_churn_db.processed_churn
GROUP BY Contract, PaymentMethod
ORDER BY churn_rate_pct DESC;


-- -----------------------------------------------------------------------------
-- QUERY 3: Impact of Add-On Services (Tech Support & Online Security) on Churn
-- Purpose: Measure customer retention metrics based on value-added security/support subscriptions.
-- -----------------------------------------------------------------------------
SELECT 
    InternetService,
    TechSupport,
    OnlineSecurity,
    COUNT(*) AS total_users,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS churned_users,
    ROUND(100.0 * SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) AS churn_rate_pct
FROM telco_churn_db.processed_churn
WHERE InternetService != 'No'
GROUP BY InternetService, TechSupport, OnlineSecurity
ORDER BY churn_rate_pct DESC;


-- -----------------------------------------------------------------------------
-- QUERY 4: Customer Tenure Segment Analysis & Lifetime Value Lost
-- Purpose: Group customers by tenure buckets (0-12m, 13-24m, 25-48m, 49-72m) to locate critical churn drop-off periods.
-- -----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN tenure <= 12 THEN '01. 0 - 1 Year (0-12 m)'
        WHEN tenure <= 24 THEN '02. 1 - 2 Years (13-24 m)'
        WHEN tenure <= 48 THEN '03. 2 - 4 Years (25-48 m)'
        ELSE '04. Over 4 Years (49-72 m)'
    END AS tenure_group,
    COUNT(*) AS total_customers,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS churned_customers,
    ROUND(100.0 * SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) AS churn_rate_pct,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN TotalCharges ELSE 0 END), 2) AS total_lifetime_revenue_lost
FROM telco_churn_db.processed_churn
GROUP BY 1
ORDER BY tenure_group ASC;


-- -----------------------------------------------------------------------------
-- QUERY 5: High-Risk Customer Identification for Proactive Retention Campaigns
-- Purpose: Extract specific high-risk customers (Month-to-Month, Fiber Optic, No Tech Support, Tenure < 12m)
-- -----------------------------------------------------------------------------
SELECT 
    customerID,
    gender,
    tenure,
    Contract,
    InternetService,
    PaymentMethod,
    MonthlyCharges,
    TotalCharges
FROM telco_churn_db.processed_churn
WHERE Contract = 'Month-to-month'
  AND InternetService = 'Fiber optic'
  AND TechSupport = 'No'
  AND tenure <= 12
  AND Churn = 'Yes'
ORDER BY MonthlyCharges DESC
LIMIT 50;
