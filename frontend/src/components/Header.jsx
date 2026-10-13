import React from 'react';
import { 
  Activity, 
  Layers, 
  BarChart3, 
  FileSpreadsheet, 
  Cloud, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function Header({ activeTab, setActiveTab, apiStatus, modelType, setModelType }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 1.5rem'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Logo & Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ff9900 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255, 153, 0, 0.3)'
          }}>
            <Activity color="#fff" size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                TelcoChurn<span style={{ color: '#3b82f6' }}>.AI</span>
              </h1>
              <span className="badge badge-aws" style={{ fontSize: '0.7rem' }}>
                AWS Group 07
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              FastAPI Inference Engine & Retention Analytics
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '0.375rem', background: 'rgba(30, 41, 59, 0.6)', padding: '0.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn ${activeTab === 'predict' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem 0.875rem', fontSize: '0.8rem', border: 'none' }}
            onClick={() => setActiveTab('predict')}
          >
            <Activity size={16} /> Predictor
          </button>
          <button 
            className={`btn ${activeTab === 'metrics' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem 0.875rem', fontSize: '0.8rem', border: 'none' }}
            onClick={() => setActiveTab('metrics')}
          >
            <BarChart3 size={16} /> Model Analytics
          </button>
          <button 
            className={`btn ${activeTab === 'batch' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem 0.875rem', fontSize: '0.8rem', border: 'none' }}
            onClick={() => setActiveTab('batch')}
          >
            <FileSpreadsheet size={16} /> Batch CSV
          </button>
          <button 
            className={`btn ${activeTab === 'architecture' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem 0.875rem', fontSize: '0.8rem', border: 'none' }}
            onClick={() => setActiveTab('architecture')}
          >
            <Cloud size={16} /> AWS Cloud
          </button>
        </nav>

        {/* Engine Switcher (FastAPI vs S3 Pickle) & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {activeTab === 'predict' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(15, 23, 42, 0.7)', padding: '0.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setModelType('random_forest')}
                className={`btn ${modelType !== 's3_pickle' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.35rem 0.7rem', fontSize: '0.72rem', border: 'none', borderRadius: '7px' }}
                title="Switch on FastAPI native models"
              >
                <Activity size={13} /> ⚡ FastAPI Engine
              </button>
              <button
                onClick={() => setModelType('s3_pickle')}
                className={`btn ${modelType === 's3_pickle' ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  padding: '0.35rem 0.7rem',
                  fontSize: '0.72rem',
                  border: 'none',
                  borderRadius: '7px',
                  background: modelType === 's3_pickle' ? 'linear-gradient(135deg, #ff9900 0%, #ea580c 100%)' : 'transparent',
                  color: modelType === 's3_pickle' ? '#fff' : 'var(--text-secondary)'
                }}
                title="Switch to AWS S3 Pickle Pipeline (churn_model.pkl)"
              >
                <Cloud size={13} /> ☁️ AWS S3 Pickle
              </button>
            </div>
          )}

          {activeTab === 'predict' && modelType !== 's3_pickle' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <select 
                value={modelType} 
                onChange={(e) => setModelType(e.target.value)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  width: 'auto',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <option value="random_forest">🌲 SMOTE Random Forest</option>
                <option value="xgboost">⚡ Balanced XGBoost</option>
                <option value="logistic_regression">📈 SMOTE Logistic Regression</option>
              </select>
            </div>
          )}

          {/* S3 Storage Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            background: 'rgba(255, 153, 0, 0.12)',
            border: '1px solid rgba(255, 153, 0, 0.35)',
            fontSize: '0.75rem',
            color: '#fed7aa'
          }} title="AWS S3 Model Pickle Storage">
            <Cloud size={13} color="#ff9900" />
            <span style={{ fontWeight: 600 }}>S3: churn_model.pkl</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            background: apiStatus === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${apiStatus === 'online' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: '0.75rem'
          }}>
            {apiStatus === 'online' ? (
              <>
                <CheckCircle2 size={13} color="#10b981" />
                <span style={{ color: '#86efac', fontWeight: 600 }}>FastAPI: Connected</span>
              </>
            ) : (
              <>
                <AlertCircle size={13} color="#ef4444" />
                <span style={{ color: '#fca5a5', fontWeight: 600 }}>Backend Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
