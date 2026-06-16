// Manual candidate entry from the admin side
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import api from '../api/api';
import CandidateComments from '../components/CandidateComments';
import Layout from '../components/Layout';
import { INDIA_STATES, getCitiesForState } from '../data/indiaLocations';
import {
  EDUCATION_OPTIONS,
  INDUSTRY_OPTIONS,
  NOTICE_PERIOD_OPTIONS,
  withLegacyOption
} from '../constants/candidateOptions';
import { isOtherCity } from '../utils/city';
import { validateCandidateForm } from '../utils/validation';

const STATUS_OPTIONS = [
  'Applied',
  'Shortlisted',
  'Interview',
  'Selected',
  'Rejected',
  'On Hold'
];

const MAX_RESUME_MB = 5;
const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  designation: '',
  currentCTC: '',
  dateOfBirth: '',
  education: '',
  experience: '',
  noticePeriod: '',
  currentEmployer: '',
  previousEmployer: '',
  keySkills: '',
  currentIndustry: '',
  state: '',
  city: '',
  expectedSalary: '',
  status: 'Applied'
};

const AddCandidate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [customCity, setCustomCity] = useState('');
  const [draftComments, setDraftComments] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cityOptions = useMemo(
    () => (form.state ? getCitiesForState(form.state) : []),
    [form.state]
  );

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleResumeChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setResumeFile(null);
      return;
    }
    if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
      toast.error('Only PDF, DOC, and DOCX files are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_RESUME_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_RESUME_MB}MB`);
      e.target.value = '';
      return;
    }
    setResumeFile(file);
  };

  const postDraftComments = async (candidateId) => {
    for (const item of draftComments) {
      const text = String(item.comment || '').trim();
      if (!text) continue;
      try {
        await api.post(`/api/admin/candidate/${candidateId}/comments`, { comment: text });
      } catch {
        toast.error('Some comments could not be saved');
        break;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErrors = validateCandidateForm({ ...form, customCity });
    if (validationErrors.length) {
      validationErrors.forEach((msg) => toast.error(msg));
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '' && value != null) body.append(key, value);
      });
      if (isOtherCity(form.city)) {
        body.append('customCity', customCity.trim());
      }
      if (resumeFile) body.append('resume', resumeFile);

      const res = await api.post('/api/admin/candidate', body);
      const id = res.data.candidate && res.data.candidate._id;

      if (id && draftComments.length) {
        await postDraftComments(id);
      }

      toast.success('Candidate created');
      navigate(id ? `/admin/candidate/${id}` : '/admin/candidates');
    } catch (err) {
      const msg =
        (err.response && err.response.data && err.response.data.message) ||
        'Failed to create candidate';
      setError(msg);
      toast.error(msg);
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
            <input required value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
          </Field>
          <Field label="Email *">
            <input required type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
          </Field>
          <Field label="Phone *">
            <input required value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="10-digit mobile" />
          </Field>
          <Field label="Designation *">
            <input required value={form.designation} onChange={(e) => handleChange('designation', e.target.value)} placeholder="e.g. Software Engineer" />
          </Field>
          <Field label="Current CTC (LPA) *">
            <input required type="number" min="0" step="0.1" value={form.currentCTC} onChange={(e) => handleChange('currentCTC', e.target.value)} />
          </Field>
          <Field label="Date of Birth">
            <input type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
          </Field>
          <Field label="Education *">
            <select
              required
              value={form.education}
              onChange={(e) => handleChange('education', e.target.value)}
            >
              <option value="">Select education</option>
              {withLegacyOption(EDUCATION_OPTIONS, form.education).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </Field>
          <Field label="Experience (years)">
            <input type="number" min="0" value={form.experience} onChange={(e) => handleChange('experience', e.target.value)} />
          </Field>
          <Field label="Notice Period">
            <select
              value={form.noticePeriod}
              onChange={(e) => handleChange('noticePeriod', e.target.value)}
            >
              <option value="">Select notice period</option>
              {withLegacyOption(NOTICE_PERIOD_OPTIONS, form.noticePeriod).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </Field>
          <Field label="Current Employer">
            <input value={form.currentEmployer} onChange={(e) => handleChange('currentEmployer', e.target.value)} />
          </Field>
          <Field label="Previous Employer">
            <input value={form.previousEmployer} onChange={(e) => handleChange('previousEmployer', e.target.value)} />
          </Field>
          <Field label="Industry">
            <select
              value={form.currentIndustry}
              onChange={(e) => handleChange('currentIndustry', e.target.value)}
            >
              <option value="">Select industry</option>
              {withLegacyOption(INDUSTRY_OPTIONS, form.currentIndustry).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </Field>
          <Field label="State *">
            <select
              required
              value={form.state}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, state: e.target.value, city: '' }));
                setCustomCity('');
              }}
            >
              <option value="">Select state</option>
              {INDIA_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="City *">
            <select
              required
              value={form.city}
              disabled={!form.state}
              onChange={(e) => {
                const next = e.target.value;
                handleChange('city', next);
                if (!isOtherCity(next)) setCustomCity('');
              }}
            >
              <option value="">{form.state ? 'Select city' : 'Select state first'}</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          {isOtherCity(form.city) && (
            <Field label="Custom city *">
              <input
                required
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="Enter city name"
              />
            </Field>
          )}
          <Field label="Expected Salary">
            <input type="number" min="0" value={form.expectedSalary} onChange={(e) => handleChange('expectedSalary', e.target.value)} />
          </Field>
          <Field label="Key Skills (comma separated)" full>
            <input value={form.keySkills} onChange={(e) => handleChange('keySkills', e.target.value)} placeholder="React, Node.js" />
          </Field>
          <Field label="Resume (PDF / DOC / DOCX, max 5MB)" full>
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} />
            {resumeFile && (
              <p className="muted" style={{ marginTop: 8 }}>
                Selected: <strong>{resumeFile.name}</strong>
              </p>
            )}
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>

        <CandidateComments
          draftComments={draftComments}
          onDraftChange={setDraftComments}
          embedded
        />

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
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
