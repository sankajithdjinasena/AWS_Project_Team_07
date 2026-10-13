import React from 'react';
import { 
  Cloud, 
  Server, 
  Database, 
  Cpu, 
  CheckCircle, 
  GraduationCap, 
  ShieldAlert, 
  ExternalLink 
} from 'lucide-react';

export default function ArchitectureTab() {
  const steps = [
    {
      num: "01",
      title: "Amazon S3 Storage",
      subtitle: "Cloud Object Store",
      desc: "Raw CSV ingest into s3://telecom-churn-analytics-team07/raw/ with AES-256 server-side encryption.",
      color: "#ff9900"
    },
    {
      num: "02",
      title: "AWS Lambda Trigger",
      subtitle: "Event-Driven Serverless",
      desc: "TelcoDatasetValidator executes on s3:ObjectCreated, auditing columns, missing types, and data integrity.",
      color: "#f59e0b"
    },
    {
      num: "03",
      title: "AWS CloudWatch Logs",
      subtitle: "Audit & Observability",
      desc: "Centralized execution tracing under /aws/lambda/TelcoDatasetValidator for automated failure alerting.",
      color: "#ef4444"
    },
    {
      num: "04",
      title: "AWS Glue & Athena",
      subtitle: "Metadata Catalog & SQL",
      desc: "Serverless schema crawler populates Data Catalog. Athena queries churn patterns without database servers.",
      color: "#3b82f6"
    },
    {
      num: "05",
      title: "FastAPI & ML Engine",
      subtitle: "Predictive REST Microservice",
      desc: "High-performance inference engine serving SMOTE Random Forest, Balanced XGBoost, and retention advice.",
      color: "#10b981"
    }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
          AWS Cloud Architecture & Academic Project Overview
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Cloud Computing & Data Science Group Project — Sabaragamuwa University of Sri Lanka
        </p>
      </div>

      {/* Team & University Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid #ff9900' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <GraduationCap size={24} color="#ff9900" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
            Faculty of Computing | Department of Data Science — Group 07
          </h3>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Student IDs:</span>
            <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.25rem' }}>
              22CDS0431 | 22CDS027 | 22CDS0403 | 22CDS0439
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Dataset Scope:</span>
            <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.25rem' }}>
              7,043 Telco records | 21 Features
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Champion ML Model:</span>
            <div style={{ fontWeight: 600, color: '#10b981', marginTop: '0.25rem' }}>
              SMOTE Random Forest (ROC-AUC 84.5%)
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Architecture Flow */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
          End-to-End AWS System Workflow
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}>
          {steps.map((s, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '1.25rem', position: 'relative' }}>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: 900,
                color: s.color,
                opacity: 0.8,
                fontFamily: 'var(--font-mono)',
                marginBottom: '0.5rem'
              }}>
                {s.num}
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                {s.title}
              </h4>
              <div style={{ fontSize: '0.72rem', color: s.color, fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {s.subtitle}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Key EDA Takeaways */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
          Key Data Science & Empirical Business Findings
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171', marginBottom: '0.35rem' }}>
              1. Month-to-Month Contract Vulnerability
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Customers with month-to-month contracts demonstrate a 42.7% churn rate, compared to just 2.8% for two-year contracts.
            </p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.35rem' }}>
              2. First-Year Tenure Churn Spike
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Churn density peaks intensely in months 0–12. After month 24, churn propensity drops dramatically by more than 60%.
            </p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.35rem' }}>
              3. Fiber Optic + Tech Support Retention Effect
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Fiber Optic users without Tech Support churn at 41.6%. Bundling Tech Support cuts churn rate to 15.2%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
