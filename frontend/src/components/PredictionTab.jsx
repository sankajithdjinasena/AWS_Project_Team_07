import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck, 
  Lightbulb, 
  TrendingDown, 
  TrendingUp, 
  Zap, 
  User, 
  Wifi, 
  CreditCard,
  ChevronRight
} from 'lucide-react';

export default function PredictionTab({ 
  formData, 
  setFormData, 
  sampleProfiles, 
  onLoadProfile, 
  onPredict, 
  predictionResult, 
  isLoading, 
  modelType 
}) {
  const [autoComputeTotal, setAutoComputeTotal] = useState(true);

  // Sync TotalCharges whenever tenure or MonthlyCharges change if autoComputeTotal is enabled
  useEffect(() => {
    if (autoComputeTotal) {
      const computed = (Number(formData.tenure || 0) * Number(formData.MonthlyCharges || 0)).toFixed(2);
      setFormData(prev => ({ ...prev, TotalCharges: parseFloat(computed) }));
    }
  }, [formData.tenure, formData.MonthlyCharges, autoComputeTotal]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReset = () => {
    setFormData({
      gender: "Female",
      SeniorCitizen: 0,
      Partner: "No",
      Dependents: "No",
      tenure: 12,
      PhoneService: "Yes",
      MultipleLines: "No",
      InternetService: "Fiber optic",
      OnlineSecurity: "No",
      OnlineBackup: "No",
      DeviceProtection: "No",
      TechSupport: "No",
      StreamingTV: "No",
      StreamingMovies: "No",
      Contract: "Month-to-month",
      PaperlessBilling: "Yes",
      PaymentMethod: "Electronic check",
      MonthlyCharges: 75.0,
      TotalCharges: 900.0
    });
  };

  const getRiskColor = (prob) => {
    if (prob >= 65) return '#ef4444';
    if (prob >= 35) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Preset Profiles Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="#3b82f6" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            1-Click Demo Profiles:
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {sampleProfiles.map((p) => (
            <button
              key={p.id}
              onClick={() => onLoadProfile(p)}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
              title={p.description}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: p.color === 'red' ? '#ef4444' : p.color === 'green' ? '#10b981' : '#f59e0b',
                display: 'inline-block',
                marginRight: '6px'
              }} />
              {p.name.split(':')[0]}
            </button>
          ))}
          <button
            onClick={handleReset}
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
            title="Reset to default form values"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Main Grid: Form on Left, Prediction Output on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Left Column: Input Form */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Customer Feature Profile</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure 19 Telco customer parameters</p>
            </div>
            <button
              onClick={onPredict}
              disabled={isLoading}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.25rem' }}
            >
              {isLoading ? (
                <>Predicting...</>
              ) : (
                <>
                  <Zap size={16} /> Run Prediction
                </>
              )}
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onPredict(); }}>
            {/* Section 1: Demographics */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600 }}>
                <User size={16} /> Demographics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Gender</label>
                  <select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Senior Citizen</label>
                  <select value={formData.SeniorCitizen} onChange={(e) => handleChange('SeniorCitizen', Number(e.target.value))}>
                    <option value={0}>No (Under 65)</option>
                    <option value={1}>Yes (Senior Citizen)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Partner</label>
                  <select value={formData.Partner} onChange={(e) => handleChange('Partner', e.target.value)}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Dependents</label>
                  <select value={formData.Dependents} onChange={(e) => handleChange('Dependents', e.target.value)}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Subscribed Services */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600 }}>
                <Wifi size={16} /> Subscribed Services
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Phone Service</label>
                  <select value={formData.PhoneService} onChange={(e) => handleChange('PhoneService', e.target.value)}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Multiple Lines</label>
                  <select value={formData.MultipleLines} onChange={(e) => handleChange('MultipleLines', e.target.value)}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="No phone service">No phone service</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Internet Service</label>
                  <select value={formData.InternetService} onChange={(e) => handleChange('InternetService', e.target.value)}>
                    <option value="Fiber optic">Fiber optic (Fast)</option>
                    <option value="DSL">DSL (Broadband)</option>
                    <option value="No">No Internet</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Online Security</label>
                  <select value={formData.OnlineSecurity} onChange={(e) => handleChange('OnlineSecurity', e.target.value)}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="No internet service">No internet service</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Online Backup</label>
                  <select value={formData.OnlineBackup} onChange={(e) => handleChange('OnlineBackup', e.target.value)}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="No internet service">No internet service</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Device Protection</label>
                  <select value={formData.DeviceProtection} onChange={(e) => handleChange('DeviceProtection', e.target.value)}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="No internet service">No internet service</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Tech Support</label>
                  <select value={formData.TechSupport} onChange={(e) => handleChange('TechSupport', e.target.value)}>
                    <option value="No">No (High churn risk)</option>
                    <option value="Yes">Yes</option>
                    <option value="No internet service">No internet service</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Streaming TV / Movies</label>
                  <select value={formData.StreamingTV} onChange={(e) => {
                    handleChange('StreamingTV', e.target.value);
                    handleChange('StreamingMovies', e.target.value);
                  }}>
                    <option value="No">No</option>
                    <option value="Yes">Yes (Bundled)</option>
                    <option value="No internet service">No internet service</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Billing & Contract */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600 }}>
                <CreditCard size={16} /> Contract & Billing Dynamics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Contract Type</label>
                  <select value={formData.Contract} onChange={(e) => handleChange('Contract', e.target.value)}>
                    <option value="Month-to-month">Month-to-month (~42% Churn)</option>
                    <option value="One year">One year (~11% Churn)</option>
                    <option value="Two year">Two year (~3% Churn)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Payment Method</label>
                  <select value={formData.PaymentMethod} onChange={(e) => handleChange('PaymentMethod', e.target.value)}>
                    <option value="Electronic check">Electronic check (High Risk)</option>
                    <option value="Mailed check">Mailed check</option>
                    <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                    <option value="Credit card (automatic)">Credit card (automatic)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Paperless Billing</label>
                  <select value={formData.PaperlessBilling} onChange={(e) => handleChange('PaperlessBilling', e.target.value)}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Lifetime Total Charges ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.TotalCharges || 0}
                    onChange={(e) => {
                      setAutoComputeTotal(false);
                      handleChange('TotalCharges', parseFloat(e.target.value) || 0);
                    }}
                  />
                </div>
              </div>

              {/* Sliders for Tenure & Monthly Charges */}
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.875rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tenure Duration:</span>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{formData.tenure} Months ({ (formData.tenure / 12).toFixed(1) } yrs)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="72"
                    value={formData.tenure}
                    onChange={(e) => handleChange('tenure', Number(e.target.value))}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Monthly Bill Charges:</span>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>${Number(formData.MonthlyCharges).toFixed(2)}/mo</span>
                  </div>
                  <input
                    type="range"
                    min="18.25"
                    max="118.75"
                    step="0.5"
                    value={formData.MonthlyCharges}
                    onChange={(e) => handleChange('MonthlyCharges', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Prediction Result & Insights */}
        <div>
          {predictionResult ? (
            <div className="glass-panel" style={{ padding: '1.5rem', border: `1px solid ${getRiskColor(predictionResult.churn_probability)}40` }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inference Output</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                    {predictionResult.prediction === 'Churn' ? 'Customer Likely to Churn' : 'Customer Likely to Retain'}
                  </h3>
                </div>
                <div 
                  className={`badge ${predictionResult.risk_level === 'High' ? 'badge-danger pulse-high-risk' : predictionResult.risk_level === 'Medium' ? 'badge-warning' : 'badge-success'}`}
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
                >
                  {predictionResult.risk_level} Risk
                </div>
              </div>

              {/* Probability Meter & Visual Gauge */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {predictionResult.churn_probability >= 50 ? (
                      <TrendingUp color="#ef4444" size={20} />
                    ) : (
                      <TrendingDown color="#10b981" size={20} />
                    )}
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Churn Probability:
                    </span>
                  </div>
                  <span style={{
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    color: getRiskColor(predictionResult.churn_probability),
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {predictionResult.churn_probability}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '10px', background: 'rgba(51, 65, 85, 0.5)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <div style={{
                    width: `${predictionResult.churn_probability}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)`,
                    transition: 'width 0.6s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>0% Safe</span>
                  <span>35% Moderate</span>
                  <span>65% Critical Churn</span>
                </div>
              </div>

              {/* Model Attribution Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', padding: '0.5rem 0.75rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '8px' }}>
                <span>Engine: <strong style={{ color: '#fff' }}>{predictionResult.model_used}</strong></span>
                <span>Tenure: <strong style={{ color: '#fff' }}>{predictionResult.customer_summary.tenure_months} mo</strong></span>
                <span>Spend: <strong style={{ color: '#fff' }}>${predictionResult.customer_summary.monthly_charges}/mo</strong></span>
              </div>

              {/* Key Risk Drivers */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#fca5a5' }}>
                  <AlertTriangle size={16} /> Identified Risk Drivers
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {predictionResult.risk_factors.map((factor, idx) => (
                    <div key={idx} style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      borderLeft: '3px solid #ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <ChevronRight size={14} color="#ef4444" />
                      {factor}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Retention Recommendations */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#86efac' }}>
                  <Lightbulb size={16} /> Prescriptive Retention Playbook
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {predictionResult.recommendations.map((rec, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(16, 185, 129, 0.07)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a7f3d0', marginBottom: '0.2rem' }}>
                        {rec.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                        {rec.action}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6ee7b7', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ShieldCheck size={12} /> {rec.expected_impact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <Zap size={32} color="#3b82f6" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                Ready to Predict Churn Risk
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                Adjust customer parameters on the left or select a 1-click demo profile above to compute real-time machine learning predictions and retention strategies.
              </p>
              <button
                onClick={onPredict}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.5rem' }}
              >
                <Zap size={16} /> Predict Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
