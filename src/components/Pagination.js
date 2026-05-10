// Compact, accessible pagination control
import React from 'react';

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  // Build a small window of page numbers around the current page
  const windowSize = 2;
  const start = Math.max(1, page - windowSize);
  const end = Math.min(totalPages, page + windowSize);
  const pages = [];
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <div className="pagination">
      <button
        className="btn btn-outline"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Prev
      </button>

      {start > 1 && (
        <>
          <button className="btn btn-outline" onClick={() => onChange(1)}>1</button>
          {start > 2 && <span className="pagination-ellipsis">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          className={'btn ' + (p === page ? 'btn-primary' : 'btn-outline')}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pagination-ellipsis">…</span>}
          <button className="btn btn-outline" onClick={() => onChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}

      <button
        className="btn btn-outline"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
