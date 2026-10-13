import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PredictionTab from './components/PredictionTab';
import MetricsTab from './components/MetricsTab';
import BatchPredictionTab from './components/BatchPredictionTab';
import ArchitectureTab from './components/ArchitectureTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('predict');
  const [modelType, setModelType] = useState('random_forest');
  const [apiStatus, setApiStatus] = useState('checking');
  const [sampleProfiles, setSampleProfiles] = useState([]);
  const [metricsData, setMetricsData] = useState(null);
  const [modelStorage, setModelStorage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  // Default Form State
  const [formData, setFormData] = useState({
    gender: "Female",
    SeniorCitizen: 0,
    Partner: "No",
    Dependents: "No",
    tenure: 2,
    PhoneService: "Yes",
    MultipleLines: "No",
    InternetService: "Fiber optic",
    OnlineSecurity: "No",
    OnlineBackup: "No",
    DeviceProtection: "No",
    TechSupport: "No",
    StreamingTV: "Yes",
    StreamingMovies: "No",
    Contract: "Month-to-month",
    PaperlessBilling: "Yes",
    PaymentMethod: "Electronic check",
    MonthlyCharges: 85.50,
    TotalCharges: 171.00
  });

  // Health check and initial metadata fetch
  useEffect(() => {
    const checkApi = async () => {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch (err) {
        setApiStatus('offline');
      }

      // Fetch Sample Profiles
      try {
        const samplesRes = await fetch('/api/sample-profiles');
        if (samplesRes.ok) {
          const profiles = await samplesRes.json();
          setSampleProfiles(profiles);
        }
      } catch (err) {
        console.warn('Could not fetch sample profiles:', err);
      }

      // Fetch Metrics & Model Info
      try {
        const metricsRes = await fetch('/api/metrics');
        if (metricsRes.ok) {
          const mData = await metricsRes.json();
          setMetricsData(mData);
        }
      } catch (err) {
        console.warn('Could not fetch metrics:', err);
      }

      try {
        const infoRes = await fetch('/api/model-info');
        if (infoRes.ok) {
          const info = await infoRes.json();
          if (info.model_storage) {
            setModelStorage(info.model_storage);
          }
        }
      } catch (err) {
        console.warn('Could not fetch model storage info:', err);
      }
    };

    checkApi();
  }, []);

  // Run initial prediction on load
  useEffect(() => {
    if (apiStatus === 'online' && !predictionResult) {
      handlePredict();
    }
  }, [apiStatus]);

  // Run predict whenever modelType changes if result is already displayed
  useEffect(() => {
    if (predictionResult) {
      handlePredict();
    }
  }, [modelType]);

  const handlePredict = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/predict?model_type=${modelType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Inference returned status ${response.status}`);
      }

      const data = await response.json();
      setPredictionResult(data);
    } catch (err) {
      console.error('Prediction request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadProfile = (profile) => {
    setFormData(profile.data);
    // Auto-predict for newly selected profile
    setTimeout(() => {
      handlePredictWithData(profile.data);
    }, 50);
  };

  const handlePredictWithData = async (dataPayload) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/predict?model_type=${modelType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataPayload)
      });

      if (response.ok) {
        const data = await response.json();
        setPredictionResult(data);
      }
    } catch (err) {
      console.error('Prediction request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        apiStatus={apiStatus}
        modelType={modelType}
        setModelType={setModelType}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'predict' && (
          <PredictionTab
            formData={formData}
            setFormData={setFormData}
            sampleProfiles={sampleProfiles}
            onLoadProfile={handleLoadProfile}
            onPredict={handlePredict}
            predictionResult={predictionResult}
            isLoading={isLoading}
            modelType={modelType}
            setModelType={setModelType}
            modelStorage={modelStorage}
          />
        )}

        {activeTab === 'metrics' && (
          <MetricsTab metricsData={metricsData} />
        )}

        {activeTab === 'batch' && (
          <BatchPredictionTab modelType={modelType} />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureTab />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '1.25rem 1.5rem',
        marginTop: '2rem',
        background: 'rgba(15, 23, 42, 0.95)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <strong style={{ color: '#fff' }}>AWS Cloud & ML Telco Churn Solution</strong> — Sabaragamuwa University of Sri Lanka (Group 07)
          </div>
          <div>
            Powered by <strong style={{ color: '#38bdf8' }}>FastAPI</strong> & <strong style={{ color: '#61dafb' }}>React JSX</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
