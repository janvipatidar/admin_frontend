// Coloured badge for candidate status
import React from 'react';

const StatusBadge = ({ status }) => {
  const cls = 'badge badge-' + (status || 'Applied').toLowerCase().replace(/\s+/g, '-');
  return <span className={cls}>{status}</span>;
};

export default StatusBadge;
