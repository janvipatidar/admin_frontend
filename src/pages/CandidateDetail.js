// Full candidate profile + status update + notes
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import api from '../api/api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';

const STATUS_OPTIONS = [
  'Applied',
  'Shortlisted',
  'Interview',
  'Selected',
  'Rejected',
  'On Hold'
];

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/candidate/${id}`);
      setCandidate(res.data);
      setStatus(res.data.status || 'Applied');
      setNotes(res.data.notes || '');
    } catch (err) {
      setError('Failed to load candidate');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const res = await api.put(`/api/admin/candidate/${id}`, { status, notes });
      setCandidate(res.data.candidate);
      setSavedMsg('Saved');
      setTimeout(() => setSavedMsg(''), 1500);
    } catch (err) {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this candidate? This cannot be undone.')) return;
    try {
      await api.delete(`/api/admin/candidate/${id}`);
      navigate('/admin/candidates', { replace: true });
    } catch (err) {
      setError('Failed to delete');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loader">Loading candidate…</div>
      </Layout>
    );
  }

  if (error || !candidate) {
    return (
      <Layout>
        <div className="alert alert-error">{error || 'Candidate not found'}</div>
        <Link to="/admin/candidates" className="btn btn-outline">← Back</Link>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>{candidate.name}</h1>
          <p className="muted">{candidate.email} · {candidate.phone}</p>
        </div>
        <div className="page-header-actions">
          <Link to="/admin/candidates" className="btn btn-outline">← Back</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left: profile */}
        <div className="detail-main">
          <div className="card">
            <div className="card-header">
              <h3>Profile</h3>
              <StatusBadge status={candidate.status} />
            </div>
            <div className="info-grid">
              <Info label="Education" value={candidate.education} />
              <Info label="Experience" value={`${candidate.experience} years`} />
              <Info label="Notice Period" value={candidate.noticePeriod} />
              <Info label="Current Employer" value={candidate.currentEmployer} />
              <Info label="Previous Employer" value={candidate.previousEmployer} />
              <Info label="Industry" value={candidate.currentIndustry} />
              <Info label="Location" value={candidate.location} />
              <Info
                label="Expected Salary"
                value={candidate.expectedSalary ? candidate.expectedSalary : '—'}
              />
              <Info
                label="Date of Birth"
                value={
                  candidate.dateOfBirth
                    ? new Date(candidate.dateOfBirth).toLocaleDateString()
                    : '—'
                }
              />
              <Info
                label="Applied On"
                value={new Date(candidate.createdAt).toLocaleString()}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Skills</h3></div>
            <div className="skill-chips">
              {(candidate.keySkills || []).length === 0 && <span className="muted">—</span>}
              {(candidate.keySkills || []).map((s) => (
                <span key={s} className="chip">{s}</span>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Resume</h3></div>
            {candidate.resumeUrl ? (
              <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-outline">
                Open Resume ↗
              </a>
            ) : (
              <span className="muted">No resume uploaded</span>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="detail-side">
          <div className="card">
            <div className="card-header"><h3>Update Status</h3></div>
            <div className="field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <span>Notes</span>
              <textarea
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this candidate…"
              />
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {savedMsg && <div className="alert alert-success" style={{ marginTop: 12 }}>{savedMsg}</div>}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const Info = ({ label, value }) => (
  <div className="info-item">
    <div className="info-label">{label}</div>
    <div className="info-value">{value || '—'}</div>
  </div>
);

export default CandidateDetail;
