// Dashboard page - high level stats
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../api/api';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/admin/candidates/stats');
        setStats(res.data);
      } catch (err) {
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Overview of all candidates in your pipeline.</p>
        </div>
        <Link to="/admin/candidates" className="btn btn-primary">
          View all candidates
        </Link>
      </div>

      {loading && <div className="loader">Loading stats…</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <StatCard label="Total Candidates" value={stats.total} accent="primary" />
          <StatCard label="Applied" value={stats.Applied} accent="info" />
          <StatCard label="Shortlisted" value={stats.Shortlisted} accent="warning" />
          <StatCard label="Interview" value={stats.Interview} accent="purple" />
          <StatCard label="Selected" value={stats.Selected} accent="success" />
          <StatCard label="Rejected" value={stats.Rejected} accent="danger" />
        </div>
      )}

      {stats && (
        <div className="pipeline">
          <h2>Pipeline</h2>
          <div className="pipeline-row">
            {['Applied', 'Shortlisted', 'Interview', 'Selected'].map((s, i, arr) => (
              <React.Fragment key={s}>
                <div className="pipeline-stage">
                  <div className="pipeline-count">{stats[s] || 0}</div>
                  <div className="pipeline-label">{s}</div>
                </div>
                {i < arr.length - 1 && <div className="pipeline-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
