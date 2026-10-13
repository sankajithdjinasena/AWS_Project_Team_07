import React from 'react';
import { 
  Award, 
  BarChart2, 
  Layers, 
  Database, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight 
} from 'lucide-react';

export default function MetricsTab({ metricsData }) {
  if (!metricsData) {
    return (
      <div style={{ maxWidth: '1400px', margin: '2rem auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading model performance metrics...</p>
      </div>
    );
  }

  const { models = {}, feature_importances = [], sample_counts = {} } = metricsData;

  const modelCards = [
    {
      key: 'random_forest',
      badge: 'Primary Champion',
      badgeClass: 'badge-success',
      icon: '🌲',
      color: '#10b981',
      description: 'Optimized random forest with SMOTE oversampling. Delivers superior balance of precision and recall.'
    },
    {
      key: 'xgboost',
      badge: 'High Recall Specialist',
      badgeClass: 'badge-aws',
      icon: '⚡',
      color: '#ff9900',
      description: 'Gradient boosted tree with scale_pos_weight focal compensation. Captures maximum churn volume.'
    },
    {
      key: 'logistic_regression',
      badge: 'Interpretable Baseline',
      badgeClass: 'badge-warning',
      icon: '📈',
      color: '#3b82f6',
      description: 'Linear baseline trained on SMOTE-balanced feature vectors.'
    }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
          Machine Learning Model Performance & Feature Analytics
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Rigorous benchmarking on 80/20 stratified test dataset ({sample_counts.test || 1409} evaluation instances)
        </p>
      </div>

      {/* Dataset & Experiment Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <Database size={14} /> Total Dataset Records
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>7,043</div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Telco Customer Dataset (IBM)</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <Layers size={14} /> Baseline Churn Rate
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171' }}>{sample_counts.baseline_churn_rate || 26.54}%</div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>1,869 Churned vs 5,174 Retained</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <TrendingUp size={14} /> SMOTE Balancing
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{sample_counts.smote_train || 8278}</div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Synthetically balanced train set</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <Award size={14} /> Champion ROC-AUC
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>
            {models.random_forest ? (models.random_forest.roc_auc * 100).toFixed(1) : 84.5}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Random Forest Champion Model</div>
        </div>
      </div>

      {/* Model Cards Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {modelCards.map((mc) => {
          const modelData = models[mc.key] || {};
          return (
            <div key={mc.key} className="glass-panel" style={{ padding: '1.5rem', borderTop: `4px solid ${mc.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{mc.icon}</span>
                  <h3 style={{ display: 'inline-block', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                    {modelData.name || mc.key}
                  </h3>
                </div>
                <span className={`badge ${mc.badgeClass}`}>{mc.badge}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', minHeight: '36px' }}>
                {mc.description}
              </p>

              {/* Metrics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '0.875rem',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Accuracy</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                    {modelData.accuracy ? (modelData.accuracy * 100).toFixed(1) : '-'}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recall</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>
                    {modelData.recall ? (modelData.recall * 100).toFixed(1) : '-'}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Precision</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>
                    {modelData.precision ? (modelData.precision * 100).toFixed(1) : '-'}%
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>F1-Score</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa' }}>
                    {modelData.f1 ? (modelData.f1 * 100).toFixed(1) : '-'}%
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ROC-AUC Area</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
                    {modelData.roc_auc ? (modelData.roc_auc * 100).toFixed(1) : '-'}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Importances Chart */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Top 15 Churn Predictors (Feature Importance Analysis)
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Gini Importance from Random Forest Ensemble
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {feature_importances.map((item, index) => {
            const maxImportance = feature_importances[0]?.importance || 0.15;
            const pct = ((item.importance / maxImportance) * 100).toFixed(0);
            
            // Clean display name
            let cleanName = item.feature
              .replace('cat__', '')
              .replace('num__', '')
              .replace('_', ' ');

            return (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '220px 1fr 70px', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: index < 3 ? '#93c5fd' : 'var(--text-secondary)', fontWeight: index < 3 ? 600 : 400 }}>
                  #{index + 1} {cleanName}
                </span>
                
                {/* Visual Bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(51, 65, 85, 0.4)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: index === 0 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : index < 3 ? 'linear-gradient(90deg, #2563eb, #38bdf8)' : '#475569',
                    borderRadius: '9999px'
                  }} />
                </div>

                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textAlign: 'right' }}>
                  {(item.importance * 100).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
