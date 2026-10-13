import React, { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Download, 
  Users, 
  Zap 
} from 'lucide-react';

export default function BatchPredictionTab({ modelType }) {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg('Please select a CSV file first.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/batch-predict?model_type=${modelType}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      setBatchResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error processing CSV. Please ensure it follows the Telco Customer Churn schema.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDemoBatch = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const csvRes = await fetch('/api/sample-csv');
      if (!csvRes.ok) throw new Error('Could not load sample CSV');
      const blob = await csvRes.blob();
      const demoFile = new File([blob], 'telco_sample_batch.csv', { type: 'text/csv' });
      setFile(demoFile);

      const formData = new FormData();
      formData.append('file', demoFile);
      const res = await fetch(`/api/batch-predict?model_type=${modelType}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Batch inference failed');
      const data = await res.json();
      setBatchResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process demo batch. Please verify FastAPI backend is active.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!batchResult?.predictions) return;
    const headers = ['CustomerID', 'Contract', 'Tenure', 'MonthlyCharges', 'Prediction', 'ChurnProbability', 'RiskLevel'];
    const rows = batchResult.predictions.map(p => [
      p.customerID,
      `"${p.contract}"`,
      p.tenure,
      p.monthly_charges,
      p.churn_prediction,
      p.churn_probability,
      p.risk_level
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `churn_batch_predictions_${modelType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPredictions = batchResult?.predictions?.filter(p => {
    const matchesSearch = p.customerID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.contract?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'ALL' || p.risk_level?.toUpperCase() === filterRisk;
    return matchesSearch && matchesRisk;
  }) || [];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
          Batch Customer Churn Inference (CSV Upload)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Evaluate churn risk for up to 100 customer records simultaneously using the FastAPI ML pipeline.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{
          border: '2px dashed var(--border-color)',
          borderRadius: '12px',
          padding: '2rem 1.5rem',
          background: 'rgba(15, 23, 42, 0.4)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <Upload size={36} color="#3b82f6" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
            Upload Telco Customer CSV
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Compatible with standard Telco Customer Churn dataset files
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input 
              type="file" 
              accept=".csv" 
              id="csv-file-input" 
              onChange={handleFileChange}
              style={{ display: 'none' }} 
            />
            <label htmlFor="csv-file-input" className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
              <FileSpreadsheet size={16} /> {file ? file.name : 'Choose CSV File'}
            </label>

            <button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem' }}
            >
              {isLoading ? 'Processing Pipeline...' : <><Zap size={16} /> Process Uploaded File</>}
            </button>

            <button
              onClick={handleRunDemoBatch}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', border: '1px solid rgba(59, 130, 246, 0.4)' }}
              title="Immediately evaluate 20 records from the Telco dataset"
            >
              <Zap size={15} color="#38bdf8" /> 1-Click Demo Batch (20 Rows)
            </button>

            <a
              href="/api/sample-csv"
              download="telco_sample_batch.csv"
              className="btn btn-outline"
              style={{ fontSize: '0.8rem' }}
              title="Download sample Telco CSV for testing"
            >
              <Download size={15} /> Sample CSV
            </a>
          </div>

          {errorMsg && (
            <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.75rem' }}>
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Batch Summary Stats */}
      {batchResult && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div className="glass-panel" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Evaluated Records</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                {batchResult.summary.total_processed}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Predicted to Churn</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>
                {batchResult.summary.predicted_churn} ({((batchResult.summary.predicted_churn / batchResult.summary.total_processed) * 100).toFixed(1)}%)
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High Risk Accounts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>
                {batchResult.summary.high_risk_count}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Medium Risk Accounts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
                {batchResult.summary.medium_risk_count}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low Risk Accounts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                {batchResult.summary.low_risk_count}
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '320px' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search customer ID or contract..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (
                  <button
                    key={level}
                    onClick={() => setFilterRisk(level)}
                    className={`btn ${filterRisk === level ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  >
                    {level}
                  </button>
                ))}
                <button
                  onClick={handleExportCSV}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', marginLeft: '0.5rem' }}
                  title="Download evaluated results as a CSV spreadsheet"
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Customer ID</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Contract</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Tenure</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Monthly Bill</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Prediction</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Probability</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPredictions.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fff' }}>
                        {row.customerID}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {row.contract}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {row.tenure} mo
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#38bdf8' }}>
                        ${row.monthly_charges}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{
                          fontWeight: 700,
                          color: row.churn_prediction === 'Churn' ? '#f87171' : '#4ade80'
                        }}>
                          {row.churn_prediction}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'var(--font-mono)' }}>
                        {row.churn_probability}%
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span className={`badge ${
                          row.risk_level === 'High' ? 'badge-danger' :
                          row.risk_level === 'Medium' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {row.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
