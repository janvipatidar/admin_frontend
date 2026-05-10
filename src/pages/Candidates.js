// Candidates list page - search, filters, pagination, Excel export
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import api from '../api/api';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

const STATUS_OPTIONS = [
  'Applied',
  'Shortlisted',
  'Interview',
  'Selected',
  'Rejected',
  'On Hold'
];

const NOTICE_PERIOD_OPTIONS = [
  'Immediate',
  '15 days',
  '30 days',
  '60 days',
  '90 days'
];

const initialFilters = {
  status: '',
  experienceMin: '',
  experienceMax: '',
  location: '',
  industry: '',
  education: '',
  noticePeriod: '',
  skills: ''
};

const Candidates = () => {
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Build the query string from the controlled state
  const queryParams = useMemo(() => {
    const params = { page, limit };
    if (keyword) params.keyword = keyword;
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) params[k] = v;
    });
    return params;
  }, [keyword, filters, page, limit]);

  const fetchCandidates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/candidates', { params: queryParams });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever query params change
  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCandidates();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPage(1);
    fetchCandidates();
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setKeyword('');
    setPage(1);
    // Use timeout-free direct fetch with cleared state
    setTimeout(fetchCandidates, 0);
  };

  // Excel export — pulls the full filtered set from the API and builds the
  // .xlsx in the browser using SheetJS + file-saver.
  const exportExcel = async () => {
    console.log('[export] start');

    // 1) Verify the libraries actually loaded
    if (!XLSX || !XLSX.utils) {
      alert('xlsx library is not loaded. Run "npm install" in the frontend folder and restart npm start.');
      return;
    }
    if (typeof saveAs !== 'function') {
      alert('file-saver is not loaded. Run "npm install" in the frontend folder and restart npm start.');
      return;
    }

    // 2) Fetch the data
    let rows = [];
    try {
      const exportParams = { ...queryParams, page: 1, limit: 10000 };
      const res = await api.get('/api/admin/candidates', { params: exportParams });
      rows = (res && res.data && res.data.data) || [];
      console.log('[export] rows:', rows.length);
    } catch (err) {
      console.error('[export] fetch failed:', err);
      const msg =
        (err.response && err.response.data && err.response.data.message) ||
        err.message ||
        'unknown error';
      alert('Could not fetch candidates from the API: ' + msg);
      return;
    }

    if (rows.length === 0) {
      alert('No candidates to export with the current filters.');
      return;
    }

    // 3) Build + download the .xlsx
    try {
      const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '');

      const ws = XLSX.utils.json_to_sheet(
        rows.map((c) => ({
          Name: c.name || '',
          Email: c.email || '',
          Phone: c.phone || '',
          Education: c.education || '',
          'Experience (yrs)': c.experience != null ? c.experience : '',
          'Notice Period': c.noticePeriod || '',
          'Current Employer': c.currentEmployer || '',
          'Previous Employer': c.previousEmployer || '',
          Industry: c.currentIndustry || '',
          Location: c.location || '',
          'Expected Salary': c.expectedSalary != null ? c.expectedSalary : '',
          Skills: Array.isArray(c.keySkills) ? c.keySkills.join(', ') : '',
          Status: c.status || '',
          Resume: c.resumeUrl || '',
          Notes: c.notes || '',
          'Created At': formatDate(c.createdAt)
        }))
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Candidates');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      console.log('[export] buffer bytes:', excelBuffer.byteLength);

      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `candidates-${new Date().toISOString().slice(0, 10)}.xlsx`);
      console.log('[export] saveAs invoked');
    } catch (err) {
      console.error('[export] build failed:', err);
      alert('Building the Excel file failed: ' + (err.message || 'unknown error'));
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Candidates</h1>
          <p className="muted">
            {pagination.total} total · page {pagination.page} of {pagination.totalPages}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={exportExcel}>Export Excel</button>
          <Link to="/admin/candidate/new" className="btn btn-primary">+ Add Candidate</Link>
        </div>
      </div>

      {/* Top: keyword search */}
      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search by name, email, skill, employer…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className="candidates-layout">
        {/* Left: filters */}
        <aside className="filters-panel">
          <div className="filters-header">
            <h3>Filters</h3>
            <button type="button" className="link-btn" onClick={clearFilters}>
              Clear
            </button>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Experience (years)</label>
            <div className="range-row">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={filters.experienceMin}
                onChange={(e) => handleFilterChange('experienceMin', e.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={filters.experienceMax}
                onChange={(e) => handleFilterChange('experienceMax', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Location</label>
            <input
              type="text"
              placeholder="e.g. Bangalore"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Industry</label>
            <input
              type="text"
              placeholder="e.g. Fintech"
              value={filters.industry}
              onChange={(e) => handleFilterChange('industry', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Education</label>
            <input
              type="text"
              placeholder="e.g. B.Tech"
              value={filters.education}
              onChange={(e) => handleFilterChange('education', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Notice Period</label>
            <select
              value={filters.noticePeriod}
              onChange={(e) => handleFilterChange('noticePeriod', e.target.value)}
            >
              <option value="">Any</option>
              {NOTICE_PERIOD_OPTIONS.map((np) => (
                <option key={np} value={np}>{np}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Skills (comma separated)</label>
            <input
              type="text"
              placeholder="React, Node.js"
              value={filters.skills}
              onChange={(e) => handleFilterChange('skills', e.target.value)}
            />
          </div>

          <button className="btn btn-primary btn-block" onClick={applyFilters}>
            Apply Filters
          </button>
        </aside>

        {/* Right: list */}
        <section className="candidates-list">
          {loading && <div className="loader">Loading candidates…</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {!loading && data.length === 0 && (
            <div className="empty-state">
              <h3>No candidates found</h3>
              <p>Try adjusting filters or clearing the search.</p>
            </div>
          )}

          {!loading && data.length > 0 && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Current Employer</th>
                    <th>Experience</th>
                    <th>Skills</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div className="cell-primary">{c.name}</div>
                        <div className="cell-sub">{c.email}</div>
                      </td>
                      <td>{c.currentEmployer || '—'}</td>
                      <td>{c.experience} yrs</td>
                      <td>
                        <div className="skill-chips">
                          {(c.keySkills || []).slice(0, 3).map((s) => (
                            <span key={s} className="chip">{s}</span>
                          ))}
                          {(c.keySkills || []).length > 3 && (
                            <span className="chip chip-muted">
                              +{c.keySkills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{c.location || '—'}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>
                        <Link
                          to={`/admin/candidate/${c._id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onChange={setPage}
          />
        </section>
      </div>
    </Layout>
  );
};

export default Candidates;
