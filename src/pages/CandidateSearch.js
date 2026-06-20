// Naukri Resdex UI + all advanced filters (form view → results cards)
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import api from '../api/api';
import Layout from '../components/Layout';
import TagInput from '../components/TagInput';
import StatusBadge from '../components/StatusBadge';
import { getResumeUrl } from '../utils/mediaUrl';

import '../styles/resdex.css';

const STORAGE_KEY = 'placement_crm_candidate_search';

const NOTICE_OPTIONS = [
  'Immediate', '15 days', '15 Days', '1 month', '1 Month',
  '2 months', '2 Months', '3 months', '3 Months', 'More than 3 Months', '6 months'
];

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const STATUS_OPTIONS = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'On Hold'];
const KEYWORD_SCOPES = [
  { value: 'entire', label: 'Entire resume' },
  { value: 'name', label: 'Name' },
  { value: 'skills', label: 'Skills' },
  { value: 'designation', label: 'Designation' }
];
const ACTIVE_IN_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '1', label: '1 month' },
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '12', label: '12 months' }
];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Relevance / Date' },
  { value: 'experience', label: 'Experience' },
  { value: 'currentCTC', label: 'Salary' },
  { value: 'name', label: 'Name' },
  { value: 'designation', label: 'Designation' }
];
const SHOW_OPTIONS = [20, 40, 60, 160];

const initialFilters = {
  includeKeywords: '',
  excludeKeywords: '',
  keywordScope: 'entire',
  keywordMatch: 'any',
  skills: '',
  experienceMin: '',
  experienceMax: '',
  locations: '',
  ctcMin: '',
  ctcMax: '',
  department: '',
  industry: '',
  company: '',
  designation: '',
  noticePeriod: '',
  ugQualification: '',
  pgQualification: '',
  education: '',
  gender: '',
  hasResume: '',
  isActive: '',
  status: '',
  createdFrom: '',
  createdTo: '',
  updatedFrom: '',
  updatedTo: '',
  activeInMonths: '6',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const splitTags = (s) =>
  String(s || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

const joinTags = (arr) => arr.join(', ');

const formatCTC = (ctc) => {
  if (!ctc && ctc !== 0) return '—';
  const str = String(ctc).trim();
  if (/lpa|lac|lacs|l\b|k\b/i.test(str)) return str;
  const num = Number(str);
  if (!Number.isNaN(num) && num > 0) return `₹ ${num.toFixed(2)} Lacs`;
  return str;
};
const formatExp = (y) => `${Number(y) || 0} yr${Number(y) === 1 ? '' : 's'}`;

const CandidateSearch = () => {
  const [view, setView] = useState('form');
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [resultCount, setResultCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const setField = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const keywordTags = useMemo(() => splitTags(filters.includeKeywords), [filters.includeKeywords]);
  const excludeTags = useMemo(() => splitTags(filters.excludeKeywords), [filters.excludeKeywords]);
  const skillTags = useMemo(() => splitTags(filters.skills), [filters.skills]);
  const locationTags = useMemo(() => splitTags(filters.locations), [filters.locations]);

  const booleanMode = filters.keywordMatch === 'all';

  const buildParams = (f, p, lim) => {
    const params = { page: p, limit: lim, sortBy: f.sortBy, sortOrder: f.sortOrder };
    Object.entries(f).forEach(([k, v]) => {
      if (v !== '' && v != null && !['sortBy', 'sortOrder', 'activeInMonths'].includes(k)) {
        params[k] = v;
      }
    });
    if (f.activeInMonths && !f.createdFrom) {
      const d = new Date();
      d.setMonth(d.getMonth() - Number(f.activeInMonths));
      params.createdFrom = d.toISOString().split('T')[0];
    }
    return params;
  };

  const runSearch = async (f, p = 1, lim = limit, silent = false) => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/candidates/search', {
        params: buildParams(f, p, lim)
      });
      setData(res.data.data);
      setPagination(res.data.pagination);
      setResultCount(res.data.resultCount ?? res.data.pagination.total);
      setPage(p);
      setView('results');
      setSelectedIds([]);
      if (!silent) {
        toast.success(`Found ${res.data.resultCount ?? res.data.pagination.total} candidate(s)`);
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.filters) setFilters(saved.filters);
      if (saved.autoRun) runSearch(saved.filters, saved.page || 1, saved.limit || 20, true);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (f, p, lim, autoRun) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ filters: f, page: p, limit: lim, autoRun }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    persist(filters, 1, limit, true);
    runSearch(filters, 1, limit);
  };

  const handleSaveSearch = () => {
    persist(filters, page, limit, false);
    toast.success('Search saved');
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setData([]);
    setResultCount(0);
    setView('form');
    sessionStorage.removeItem(STORAGE_KEY);
    toast.success('Filters reset');
  };

  const summaryText = useMemo(() => {
    const parts = [];
    if (filters.includeKeywords) parts.push(filters.includeKeywords);
    if (filters.skills) parts.push(filters.skills);
    if (filters.locations) parts.push(filters.locations);
    if (filters.experienceMin || filters.experienceMax) {
      parts.push(`${filters.experienceMin || '0'}-${filters.experienceMax || '∞'} yrs`);
    }
    if (filters.ctcMin || filters.ctcMax) {
      parts.push(`${filters.ctcMin || '0'}-${filters.ctcMax || '∞'} Lacs`);
    }
    const criteria = parts.length ? parts.join(', ') : 'your criteria';
    return `Found ${resultCount.toLocaleString()} profiles for ${criteria}`;
  }, [filters, resultCount]);

  /* ─── Shared filter fields (form + sidebar) ─── */
  const FilterFields = ({ compact = false }) => (
    <>
      {!compact && (
        <section className="rdx-block">
          <div className="rdx-block-head">
            <label className="rdx-label">Keywords</label>
            <label className="rdx-toggle">
              <span>Boolean {booleanMode ? 'on' : 'off'}</span>
              <input
                type="checkbox"
                checked={booleanMode}
                onChange={(e) => setField('keywordMatch', e.target.checked ? 'all' : 'any')}
              />
              <span className="rdx-toggle-slider" />
            </label>
          </div>
          <TagInput
            tags={keywordTags}
            onChange={(t) => setField('includeKeywords', joinTags(t))}
            placeholder="Type keyword and press Enter"
            highlightFirst
          />
          <div className="rdx-block-meta">
            <label className="rdx-check">
              <input
                type="checkbox"
                checked={booleanMode}
                onChange={(e) => setField('keywordMatch', e.target.checked ? 'all' : 'any')}
              />
              Mark all keywords as mandatory
            </label>
            <div className="rdx-scope">
              Search keyword in{' '}
              <select value={filters.keywordScope} onChange={(e) => setField('keywordScope', e.target.value)}>
                {KEYWORD_SCOPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="rdx-sub-block">
            <label className="rdx-label-sm">Exclude keywords</label>
            <TagInput tags={excludeTags} onChange={(t) => setField('excludeKeywords', joinTags(t))} />
          </div>
        </section>
      )}

      {compact && (
        <>
          <div className="rdx-sidebar-field">
            <span>Keywords</span>
            <TagInput tags={keywordTags} onChange={(t) => setField('includeKeywords', joinTags(t))} />
          </div>
          <div className="rdx-sidebar-field">
            <span>Exclude</span>
            <TagInput tags={excludeTags} onChange={(t) => setField('excludeKeywords', joinTags(t))} />
          </div>
        </>
      )}

      <section className={compact ? 'rdx-sidebar-section' : 'rdx-block'}>
        {!compact && <label className="rdx-label">IT Skills</label>}
        {compact && <div className="rdx-sidebar-section-title">IT Skills</div>}
        <TagInput
          tags={skillTags}
          onChange={(t) => setField('skills', joinTags(t))}
          placeholder="e.g. React, Node.js"
        />
      </section>

      <section className={compact ? 'rdx-sidebar-section' : 'rdx-block'}>
        {!compact && <label className="rdx-label">Experience</label>}
        {compact && <div className="rdx-sidebar-section-title">Experience (Years)</div>}
        <div className="rdx-range">
          <input type="number" min="0" placeholder="Min" value={filters.experienceMin}
            onChange={(e) => setField('experienceMin', e.target.value)} />
          <span>to</span>
          <input type="number" min="0" placeholder="Max" value={filters.experienceMax}
            onChange={(e) => setField('experienceMax', e.target.value)} />
          {!compact && <span className="rdx-range-unit">Years</span>}
        </div>
      </section>

      <section className={compact ? 'rdx-sidebar-section' : 'rdx-block'}>
        {!compact && <label className="rdx-label">Current location of candidate</label>}
        {compact && <div className="rdx-sidebar-section-title">Location</div>}
        <TagInput tags={locationTags} onChange={(t) => setField('locations', joinTags(t))} placeholder="Add location" />
      </section>

      <section className={compact ? 'rdx-sidebar-section' : 'rdx-block'}>
        {!compact && <label className="rdx-label">Annual Salary / Current CTC (Lacs)</label>}
        {compact && <div className="rdx-sidebar-section-title">Salary (INR-Lacs)</div>}
        <div className="rdx-range">
          <input type="number" min="0" step="0.1" placeholder="Min" value={filters.ctcMin}
            onChange={(e) => setField('ctcMin', e.target.value)} />
          <span>to</span>
          <input type="number" min="0" step="0.1" placeholder="Max" value={filters.ctcMax}
            onChange={(e) => setField('ctcMax', e.target.value)} />
        </div>
      </section>

      <section className={compact ? 'rdx-sidebar-section' : 'rdx-block'}>
        {!compact && <label className="rdx-label">Employment Details</label>}
        {compact && <div className="rdx-sidebar-section-title">Employment</div>}
        <div className="rdx-grid-2">
          <RdxField label="Department" value={filters.department} onChange={(v) => setField('department', v)} />
          <RdxField label="Industry" value={filters.industry} onChange={(v) => setField('industry', v)} />
          <RdxField label="Company" value={filters.company} onChange={(v) => setField('company', v)} />
          <RdxField label="Designation" value={filters.designation} onChange={(v) => setField('designation', v)} />
          <RdxSelect label="Notice Period" value={filters.noticePeriod} onChange={(v) => setField('noticePeriod', v)}
            options={[{ value: '', label: 'Any' }, ...NOTICE_OPTIONS.map((n) => ({ value: n, label: n }))]} />
        </div>
      </section>

      <section className={compact ? 'rdx-sidebar-section' : 'rdx-block'}>
        {!compact && <label className="rdx-label">Education Details</label>}
        {compact && <div className="rdx-sidebar-section-title">Education</div>}
        <div className="rdx-grid-2">
          <RdxField label="UG Qualification" value={filters.ugQualification} onChange={(v) => setField('ugQualification', v)} />
          <RdxField label="PG Qualification" value={filters.pgQualification} onChange={(v) => setField('pgQualification', v)} />
          <RdxField label="Education" value={filters.education} onChange={(v) => setField('education', v)} />
        </div>
      </section>

      <section className={compact ? 'rdx-sidebar-section' : 'rdx-block'}>
        {!compact && <label className="rdx-label">Diversity</label>}
        {compact && <div className="rdx-sidebar-section-title">Gender</div>}
        <RdxSelect label="Gender" value={filters.gender} onChange={(v) => setField('gender', v)}
          options={[{ value: '', label: 'Any' }, ...GENDER_OPTIONS.map((g) => ({ value: g, label: g }))]} />
      </section>

      <section className={compact ? 'rdx-sidebar-section' : 'rdx-block'}>
        {!compact && <label className="rdx-label">Resume Availability</label>}
        {compact && <div className="rdx-sidebar-section-title">Resume</div>}
        <RdxSelect label="Resume" value={filters.hasResume} onChange={(v) => setField('hasResume', v)}
          options={[
            { value: '', label: 'Any' },
            { value: 'yes', label: 'With Resume' },
            { value: 'no', label: 'Without Resume' }
          ]} />
      </section>

      <section className={compact ? 'rdx-sidebar-section' : 'rdx-block'}>
        {!compact && <label className="rdx-label">Candidate Status</label>}
        {compact && <div className="rdx-sidebar-section-title">Status</div>}
        <div className="rdx-grid-2">
          <RdxSelect label="Active / Inactive" value={filters.isActive} onChange={(v) => setField('isActive', v)}
            options={[
              { value: '', label: 'Any' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' }
            ]} />
          <RdxSelect label="Pipeline Status" value={filters.status} onChange={(v) => setField('status', v)}
            options={[{ value: '', label: 'Any' }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: s }))]} />
        </div>
      </section>

      <section className={compact ? 'rdx-sidebar-section' : 'rdx-block'}>
        {!compact && <label className="rdx-label">Date Filters</label>}
        {compact && <div className="rdx-sidebar-section-title">Dates</div>}
        <div className="rdx-grid-2">
          <RdxField label="Created from" type="date" value={filters.createdFrom} onChange={(v) => setField('createdFrom', v)} />
          <RdxField label="Created to" type="date" value={filters.createdTo} onChange={(v) => setField('createdTo', v)} />
          <RdxField label="Updated from" type="date" value={filters.updatedFrom} onChange={(v) => setField('updatedFrom', v)} />
          <RdxField label="Updated to" type="date" value={filters.updatedTo} onChange={(v) => setField('updatedTo', v)} />
        </div>
      </section>

      {!compact && (
        <section className="rdx-block">
          <label className="rdx-label">Sort</label>
          <div className="rdx-grid-2">
            <RdxSelect label="Sort by" value={filters.sortBy} onChange={(v) => setField('sortBy', v)}
              options={SORT_OPTIONS.map((s) => ({ value: s.value, label: s.label }))} />
            <RdxSelect label="Order" value={filters.sortOrder} onChange={(v) => setField('sortOrder', v)}
              options={[
                { value: 'desc', label: 'Newest first' },
                { value: 'asc', label: 'Oldest first' }
              ]} />
          </div>
        </section>
      )}

      {compact && (
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }}
          onClick={() => { persist(filters, 1, limit, true); runSearch(filters, 1, limit); }}>
          Apply filters
        </button>
      )}
    </>
  );

  /* ─── FORM VIEW (Screenshot 1) ─── */
  if (view === 'form') {
    return (
      <Layout>
        <div className="rdx-page rdx-form-page">
          <div className="rdx-top-tabs">
            <span className="rdx-tab rdx-tab-active">Search candidates</span>
            <Link to="/admin/candidates" className="rdx-tab">Candidate list</Link>
          </div>

          <div className="rdx-form-header">
            <h1 className="rdx-title">Search candidates</h1>
            <div className="rdx-header-actions">
              <Link to="/admin/candidates" className="rdx-header-btn rdx-header-outline">← Back</Link>
              <button type="button" className="rdx-header-btn rdx-header-outline" onClick={handleSaveSearch}>
                Save Search
              </button>
              <button type="button" className="rdx-header-btn rdx-header-outline" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>

          <form className="rdx-search-form" onSubmit={handleSearch}>
            <FilterFields />
            <div className="rdx-form-footer">
              <select className="rdx-footer-select" value={filters.activeInMonths}
                onChange={(e) => setField('activeInMonths', e.target.value)}>
                {ACTIVE_IN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.value ? `Active in - ${o.label}` : 'Active in - Any time'}
                  </option>
                ))}
              </select>
              <button type="submit" className="rdx-search-btn" disabled={loading}>
                {loading ? 'Searching…' : 'Search candidates'}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    );
  }

  /* ─── RESULTS VIEW (Screenshot 2) ─── */
  return (
    <Layout>
      <div className="rdx-page rdx-results-page">
        <div className="rdx-top-tabs">
          <span className="rdx-tab rdx-tab-active">Search candidates</span>
          <Link to="/admin/candidates" className="rdx-tab">Candidate list</Link>
        </div>

        <div className="rdx-summary-bar">
          <div className="rdx-summary-text">
            <span className="rdx-ai-badge">Results</span>
            {summaryText}
            <button type="button" className="rdx-link rdx-modify" onClick={() => setView('form')}>
              Modify
            </button>
          </div>
        </div>

        <div className="rdx-results-layout">
          <aside className="rdx-filter-sidebar rdx-filter-sidebar-full">
            <h3 className="rdx-sidebar-title">Filters</h3>
            <FilterFields compact />
          </aside>

          <section className="rdx-results-main">
            <div className="rdx-results-toolbar">
              <div className="rdx-toolbar-left">
                <select value={filters.activeInMonths}
                  onChange={(e) => {
                    const next = { ...filters, activeInMonths: e.target.value };
                    setFilters(next);
                    persist(next, 1, limit, true);
                    runSearch(next, 1, limit, true);
                  }}>
                  {ACTIVE_IN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.value ? `Active in ${o.label}` : 'Active in Any time'}
                    </option>
                  ))}
                </select>
                <select value={filters.sortBy} onChange={(e) => {
                  const next = { ...filters, sortBy: e.target.value };
                  setFilters(next);
                  runSearch(next, 1, limit, true);
                }}>
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>Sort by {s.label}</option>
                  ))}
                </select>
                <select value={limit} onChange={(e) => {
                  const lim = Number(e.target.value);
                  setLimit(lim);
                  runSearch(filters, 1, lim, true);
                }}>
                  {SHOW_OPTIONS.map((n) => (
                    <option key={n} value={n}>Show {n}</option>
                  ))}
                </select>
              </div>
              <div className="rdx-toolbar-right">
                <span className="rdx-pagination-text">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button type="button" className="rdx-page-btn" disabled={pagination.page <= 1}
                  onClick={() => { persist(filters, pagination.page - 1, limit, true); runSearch(filters, pagination.page - 1, limit, true); }}>
                  ‹
                </button>
                <button type="button" className="rdx-page-btn" disabled={pagination.page >= pagination.totalPages}
                  onClick={() => { persist(filters, pagination.page + 1, limit, true); runSearch(filters, pagination.page + 1, limit, true); }}>
                  ›
                </button>
              </div>
            </div>

            <div className="rdx-bulk-bar">
              <label className="rdx-check">
                <input type="checkbox" checked={selectedIds.length === data.length && data.length > 0}
                  onChange={(e) => setSelectedIds(e.target.checked ? data.map((c) => c._id) : [])} />
                Select all
              </label>
              {selectedIds.length > 0 && (
                <span className="rdx-selected-count">{selectedIds.length} selected</span>
              )}
            </div>

            {loading && <div className="loader">Loading…</div>}

            {!loading && data.length === 0 && (
              <div className="rdx-empty card">
                <h3>No candidates found</h3>
                <button type="button" className="btn btn-outline" onClick={() => setView('form')}>
                  Modify search
                </button>
              </div>
            )}

            {!loading && data.map((c) => (
              <article key={c._id} className="rdx-candidate-card">
                <div className="rdx-card-main">
                  <div className="rdx-card-top">
                    <input type="checkbox" checked={selectedIds.includes(c._id)}
                      onChange={() => setSelectedIds((prev) =>
                        prev.includes(c._id) ? prev.filter((x) => x !== c._id) : [...prev, c._id]
                      )} />
                    <Link to={`/admin/candidate/${c._id}`} className="rdx-candidate-name">{c.name}</Link>
                    <div className="rdx-quick-stats">
                      <span>💼 {formatExp(c.experience)}</span>
                      <span>{formatCTC(c.currentCTC)}</span>
                      <span>📍 {c.location || c.city || '—'}</span>
                    </div>
                  </div>
                  <div className="rdx-card-rows">
                    <div className="rdx-row">
                      <span className="rdx-row-label">Current</span>
                      <span>{c.designation || '—'}{c.currentEmployer ? ` at ${c.currentEmployer}` : ''}</span>
                    </div>
                    {c.previousEmployer && (
                      <div className="rdx-row">
                        <span className="rdx-row-label">Previous</span>
                        <span>{c.previousEmployer}</span>
                      </div>
                    )}
                    <div className="rdx-row">
                      <span className="rdx-row-label">Education</span>
                      <span>{c.education || c.ugQualification || '—'}</span>
                    </div>
                    <div className="rdx-row">
                      <span className="rdx-row-label">Pref. locations</span>
                      <span>{c.location || `${c.city || ''}${c.state ? `, ${c.state}` : ''}` || '—'}</span>
                    </div>
                    <div className="rdx-row">
                      <span className="rdx-row-label">Key skills</span>
                      <span className="rdx-skills-line">
                        {(c.keySkills || []).length ? c.keySkills.join(' | ') : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="rdx-card-footer">
                    <StatusBadge status={c.status} />
                    {c.resumeUrl && (
                      <a href={getResumeUrl(c.resumeUrl)} target="_blank" rel="noopener noreferrer" className="rdx-cv-link">
                        📄 CV
                      </a>
                    )}
                    <span className="rdx-meta">Modified {new Date(c.updatedAt).toLocaleDateString()}</span>
                    <span className="rdx-meta">Active {new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <aside className="rdx-card-side">
                  <div className="rdx-avatar">👤</div>
                  <p className="rdx-card-summary">
                    {`${c.designation || 'Professional'} with ${formatExp(c.experience)} experience.`}
                  </p>
                  <a href={`tel:${c.phone}`} className="rdx-btn-outline rdx-btn-full">📞 {c.phone}</a>
                  <Link to={`/admin/candidate/${c._id}`} className="rdx-btn-primary rdx-btn-full">
                    View profile
                  </Link>
                  <div className="rdx-side-links">
                    <Link to={`/admin/candidate/${c._id}`}>Comment</Link>
                    <Link to={`/admin/candidate/${c._id}`}>Save</Link>
                  </div>
                </aside>
              </article>
            ))}
          </section>
        </div>
      </div>
    </Layout>
  );
};

const RdxField = ({ label, value, onChange, type = 'text' }) => (
  <label className="rdx-field">
    <span>{label}</span>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </label>
);

const RdxSelect = ({ label, value, onChange, options }) => (
  <label className="rdx-field">
    <span>{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
);

export default CandidateSearch;
