// Candidate management — table, add, search, delete, import/export
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

import api from '../api/api';
import ConfirmModal from '../components/ConfirmModal';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { getResumeFileName, getResumeUrl } from '../utils/mediaUrl';

const Candidates = () => {
  const importInputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, mode: 'single', id: null, count: 0 });
  const [deleting, setDeleting] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/candidates', { params: { page, limit } });
      setData(res.data.data);
      setPagination(res.data.pagination);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(data.map((c) => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openSingleDelete = (id) => {
    setDeleteModal({ open: true, mode: 'single', id, count: 1 });
  };

  const openBulkDelete = () => {
    if (!selectedIds.length) {
      toast.error('Select at least one candidate');
      return;
    }
    setDeleteModal({ open: true, mode: 'bulk', id: null, count: selectedIds.length });
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteModal.mode === 'single') {
        await api.delete(`/api/admin/candidate/${deleteModal.id}`);
        toast.success('Candidate deleted');
      } else {
        const res = await api.post('/api/admin/candidates/bulk-delete', { ids: selectedIds });
        toast.success(res.data.message || 'Candidates deleted');
        if (res.data.failed > 0) {
          toast.error(`${res.data.failed} candidate(s) could not be deleted`);
        }
      }
      setDeleteModal({ open: false, mode: 'single', id: null, count: 0 });
      fetchCandidates();
    } catch (err) {
      const msg =
        (err.response && err.response.data && err.response.data.message) ||
        'Delete failed';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const exportExcel = async () => {
    try {
      const res = await api.get('/api/admin/candidates', { params: { page: 1, limit: 10000 } });
      const rows = (res.data && res.data.data) || [];
      if (!rows.length) {
        toast.error('No candidates to export');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(
        rows.map((c) => ({
          Name: c.name || '',
          Email: c.email || '',
          Phone: c.phone || '',
          Designation: c.designation || '',
          'Current CTC': c.currentCTC != null ? c.currentCTC : '',
          Education: c.education || '',
          'Experience (yrs)': c.experience != null ? c.experience : '',
          'Notice Period': c.noticePeriod || '',
          'Current Employer': c.currentEmployer || '',
          'Previous Employer': c.previousEmployer || '',
          Industry: c.currentIndustry || '',
          State: c.state || '',
          City: c.city || '',
          Location: c.location || '',
          'Expected Salary': c.expectedSalary != null ? c.expectedSalary : '',
          Skills: Array.isArray(c.keySkills) ? c.keySkills.join(', ') : '',
          Status: c.status || '',
          Active: c.isActive ? 'Yes' : 'No',
          Resume: c.resumeUrl || '',
          Notes: c.notes || '',
          'Created At': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }),
        `candidates-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success(`Exported ${rows.length} candidate(s)`);
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const importExcel = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      if (!rows.length) {
        toast.error('Excel file has no data rows');
        return;
      }
      const res = await api.post('/api/admin/candidates/import', { candidates: rows });
      toast.success(res.data.message || 'Import completed');
      if (res.data.failed > 0) toast.error(`${res.data.failed} row(s) failed`);
      fetchCandidates();
    } catch (err) {
      toast.error(
        (err.response && err.response.data && err.response.data.message) || 'Import failed'
      );
    } finally {
      e.target.value = '';
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Candidate Management</h1>
          <p className="muted">{pagination.total} candidates in database</p>
        </div>
      </div>

      <div className="toolbar card">
        <div className="toolbar-left">
          <Link to="/admin/candidate/new" className="btn btn-primary">
            + Add Candidate
          </Link>
          <Link to="/admin/candidates/search" className="btn btn-outline">
            Search Candidate
          </Link>
        </div>
        <div className="toolbar-right">
          {selectedIds.length > 0 && (
            <button type="button" className="btn btn-danger" onClick={openBulkDelete}>
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={importExcel}
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => importInputRef.current && importInputRef.current.click()}
          >
            Import Excel
          </button>
          <button type="button" className="btn btn-outline" onClick={exportExcel}>
            Export Excel
          </button>
        </div>
      </div>

      {loading && <div className="loader">Loading candidates…</div>}

      {!loading && data.length === 0 && (
        <div className="empty-state card">
          <h3>No candidates yet</h3>
          <p>Add a candidate or import from Excel to get started.</p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="table-wrap card">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Skills</th>
                <th>Exp.</th>
                <th>Designation</th>
                <th>Current CTC</th>
                <th>Location</th>
                <th>Resume</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c._id)}
                      onChange={() => toggleSelect(c._id)}
                      aria-label={`Select ${c.name}`}
                    />
                  </td>
                  <td>
                    <div className="cell-primary">{c.name}</div>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>
                    <div className="skill-chips">
                      {(c.keySkills || []).slice(0, 2).map((s) => (
                        <span key={s} className="chip">{s}</span>
                      ))}
                      {(c.keySkills || []).length > 2 && (
                        <span className="chip chip-muted">+{c.keySkills.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>{c.experience} yrs</td>
                  <td>{c.designation || '—'}</td>
                  <td>{c.currentCTC ? `${c.currentCTC} LPA` : '—'}</td>
                  <td>{c.location || c.city || '—'}</td>
                  <td>
                    {c.resumeUrl ? (
                      <a
                        href={getResumeUrl(c.resumeUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-btn"
                      >
                        {getResumeFileName(c.resumeUrl)}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <Link to={`/admin/candidate/${c._id}`} className="btn btn-outline btn-sm">
                        View
                      </Link>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => openSingleDelete(c._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />

      <ConfirmModal
        open={deleteModal.open}
        title={deleteModal.mode === 'bulk' ? 'Delete selected candidates?' : 'Delete candidate?'}
        message={
          deleteModal.mode === 'bulk'
            ? `This will permanently delete ${deleteModal.count} candidate(s) and their resume files. This cannot be undone.`
            : 'This will permanently delete this candidate and their resume file. This cannot be undone.'
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ open: false, mode: 'single', id: null, count: 0 })}
      />
    </Layout>
  );
};

export default Candidates;
