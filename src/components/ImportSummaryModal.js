import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ImportSummaryModal = ({ open, summary, onClose }) => {
  if (!open || !summary) return null;

  const downloadFailedRows = () => {
    const rows = [
      ...(summary.failures || []).map((f) => ({
        Row: f.row,
        Name: f.name || '',
        Type: 'Failed',
        Reason: f.reason || ''
      })),
      ...(summary.duplicateRows || []).map((f) => ({
        Row: f.row,
        Name: f.name || '',
        Type: 'Duplicate',
        Reason: f.reason || ''
      })),
      ...(summary.skippedRows || []).map((f) => ({
        Row: f.row,
        Name: f.name || '',
        Type: 'Skipped',
        Reason: f.reason || ''
      }))
    ];

    if (!rows.length) return;

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Issues');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }),
      `import-issues-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const hasIssues =
    (summary.failed || 0) > 0 ||
    (summary.duplicates || 0) > 0 ||
    (summary.skipped || 0) > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card import-summary-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Import Summary</h3>
        <div className="import-summary-grid">
          <div className="import-stat success">
            <span className="import-stat-value">{summary.imported ?? 0}</span>
            <span className="import-stat-label">Imported</span>
          </div>
          <div className="import-stat muted">
            <span className="import-stat-value">{summary.skipped ?? 0}</span>
            <span className="import-stat-label">Skipped</span>
          </div>
          <div className="import-stat warning">
            <span className="import-stat-value">{summary.duplicates ?? 0}</span>
            <span className="import-stat-label">Duplicates</span>
          </div>
          <div className="import-stat danger">
            <span className="import-stat-value">{summary.failed ?? 0}</span>
            <span className="import-stat-label">Failed</span>
          </div>
        </div>
        <p className="muted import-summary-message">{summary.message}</p>
        <div className="modal-actions">
          {hasIssues && (
            <button type="button" className="btn btn-outline" onClick={downloadFailedRows}>
              Download issue rows
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportSummaryModal;
