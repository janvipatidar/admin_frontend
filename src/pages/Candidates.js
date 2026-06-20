// Candidate management — table, add, search, delete, import/export
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

import api from '../api/api';
import ConfirmModal from '../components/ConfirmModal';
import ImportSummaryModal from '../components/ImportSummaryModal';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { EXCEL_SHEET_NAME, candidateToExportRow } from '../constants/excelTemplate';

const formatPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone || '—';
};

const formatLocation = (c) => {
  if (c.location) return c.location;
  if (c.city && c.state) return `${c.city}, ${c.state}`;
  return c.city || c.state || '—';
};

const formatExperience = (exp) =>
  exp != null && exp !== '' ? `${exp} yrs` : '—';

const CellEllipsis = ({ value, title }) => {
  const display = value || '—';
  return (
    <td>
      <span className="cell-ellipsis" title={title || (display !== '—' ? String(display) : '')}>
        {display}
      </span>
    </td>
  );
};

const Candidates = () => {
  const importInputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, mode: 'single', id: null, count: 0 });
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/api/admin/candidates', { params });
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
  }, [page, limit, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

      const ws = XLSX.utils.json_to_sheet(rows.map(candidateToExportRow));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, EXCEL_SHEET_NAME);
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
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheetName = wb.SheetNames.includes(EXCEL_SHEET_NAME)
        ? EXCEL_SHEET_NAME
        : wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      if (!rows.length) {
        toast.error('Excel file has no data rows');
        return;
      }
      const res = await api.post('/api/admin/candidates/import', { candidates: rows });
      setImportSummary({
        message: res.data.message,
        imported: res.data.imported ?? res.data.created ?? 0,
        skipped: res.data.skipped ?? 0,
        duplicates: res.data.duplicates ?? 0,
        failed: res.data.failed ?? 0,
        failures: res.data.failures || [],
        duplicateRows: res.data.duplicateRows || [],
        skippedRows: res.data.skippedRows || []
      });
      if ((res.data.imported ?? res.data.created ?? 0) > 0) {
        toast.success(res.data.message);
      }
      fetchCandidates();
    } catch (err) {
      toast.error(
        (err.response && err.response.data && err.response.data.message) || 'Import failed'
      );
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

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
            disabled={importing}
            onClick={() => importInputRef.current && importInputRef.current.click()}
          >
            {importing ? 'Importing…' : 'Import Excel'}
          </button>
          <button type="button" className="btn btn-outline" onClick={exportExcel}>
            Export Excel
          </button>
        </div>
      </div>

      <div className="candidates-search-bar card">
        <input
          type="search"
          className="candidates-search-input"
          placeholder="Search by name, email, mobile, experience, or location…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search candidates"
        />
        {searchInput && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setSearchInput('')}
          >
            Clear
          </button>
        )}
      </div>

      {loading && <div className="loader">Loading candidates…</div>}

      {!loading && data.length === 0 && !search && (
        <div className="empty-state card">
          <h3>No candidates yet</h3>
          <p>Add a candidate or import from Excel to get started.</p>
        </div>
      )}

      {!loading && data.length === 0 && search && (
        <div className="empty-state card">
          <h3>No candidates found</h3>
          <p>No results for &ldquo;{search}&rdquo;. Try a different search term.</p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="table-wrap card candidates-table-wrap">
          <table className="data-table candidates-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="col-name">Name</th>
                <th className="col-designation">Current Designation</th>
                <th className="col-company">Current Company</th>
                <th className="col-exp">Experience</th>
                <th className="col-location">Location</th>
                <th className="col-comments">Latest Comment</th>
                <th className="col-actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c._id}>
                  <td className="col-check">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c._id)}
                      onChange={() => toggleSelect(c._id)}
                      aria-label={`Select ${c.name}`}
                    />
                  </td>
                  <td className="col-name">
                    <div className="cell-primary cell-ellipsis" title={c.name}>
                      {c.name}
                    </div>
                    <div className="cell-sub cell-ellipsis" title={formatPhone(c.phone)}>
                      {formatPhone(c.phone)}
                    </div>
                  </td>
                  <CellEllipsis value={c.designation} title={c.designation} />
                  <CellEllipsis value={c.currentEmployer} title={c.currentEmployer} />
                  <td className="col-exp">{formatExperience(c.experience)}</td>
                  <CellEllipsis value={formatLocation(c)} title={formatLocation(c)} />
                  <td className="col-comments">
                    <span
                      className="cell-ellipsis"
                      title={c.latestComment || 'No comments'}
                    >
                      {c.latestComment || 'No comments'}
                    </span>
                  </td>
                  <td className="col-actions">
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

      <ImportSummaryModal
        open={!!importSummary}
        summary={importSummary}
        onClose={() => setImportSummary(null)}
      />
    </Layout>
  );
};

export default Candidates;
