// Manual candidate entry from the admin side
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/api';
import Layout from '../components/Layout';

const STATUS_OPTIONS = [
  'Applied',
  'Shortlisted',
  'Interview',
  'Selected',
  'Rejected',
  'On Hold'
];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  education: '',
  experience: '',
  noticePeriod: '',
  currentEmployer: '',
  previousEmployer: '',
  keySkills: '',
  currentIndustry: '',
  location: '',
  expectedSalary: '',
  resumeUrl: '',
  status: 'Applied',
  notes: ''
};

const AddCandidate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.post('/api/admin/candidate', form);
      const id = res.data.candidate && res.data.candidate._id;
      navigate(id ? `/admin/candidate/${id}` : '/admin/candidates');
    } catch (err) {
      setError(
        (err.response && err.response.data && err.response.data.message) ||
          'Failed to create candidate'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Add Candidate</h1>
          <p className="muted">Manually create a new candidate profile.</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <Field label="Name *">
            <input
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </Field>
          <Field label="Email *">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </Field>
          <Field label="Phone *">
            <input
              required
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </Field>
          <Field label="Date of Birth">
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            />
          </Field>
          <Field label="Education">
            <input
              value={form.education}
              onChange={(e) => handleChange('education', e.target.value)}
              placeholder="e.g. B.Tech CS, IIT Delhi"
            />
          </Field>
          <Field label="Experience (years)">
            <input
              type="number"
              min="0"
              value={form.experience}
              onChange={(e) => handleChange('experience', e.target.value)}
            />
          </Field>
          <Field label="Notice Period">
            <input
              value={form.noticePeriod}
              onChange={(e) => handleChange('noticePeriod', e.target.value)}
              placeholder="e.g. 30 days"
            />
          </Field>
          <Field label="Current Employer">
            <input
              value={form.currentEmployer}
              onChange={(e) => handleChange('currentEmployer', e.target.value)}
            />
          </Field>
          <Field label="Previous Employer">
            <input
              value={form.previousEmployer}
              onChange={(e) => handleChange('previousEmployer', e.target.value)}
            />
          </Field>
          <Field label="Industry">
            <input
              value={form.currentIndustry}
              onChange={(e) => handleChange('currentIndustry', e.target.value)}
            />
          </Field>
          <Field label="Location">
            <input
              value={form.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </Field>
          <Field label="Expected Salary">
            <input
              type="number"
              min="0"
              value={form.expectedSalary}
              onChange={(e) => handleChange('expectedSalary', e.target.value)}
            />
          </Field>
          <Field label="Key Skills (comma separated)" full>
            <input
              value={form.keySkills}
              onChange={(e) => handleChange('keySkills', e.target.value)}
              placeholder="React, Node.js, MongoDB"
            />
          </Field>
          <Field label="Resume URL" full>
            <input
              value={form.resumeUrl}
              onChange={(e) => handleChange('resumeUrl', e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Notes" full>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </Field>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create Candidate'}
          </button>
        </div>
      </form>
    </Layout>
  );
};

const Field = ({ label, children, full }) => (
  <label className={'field' + (full ? ' field-full' : '')}>
    <span>{label}</span>
    {children}
  </label>
);

export default AddCandidate;
