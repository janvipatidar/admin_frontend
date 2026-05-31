// Contact form submissions from the public website
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import api from '../api/api';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';

const Contacts = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/contacts', { params: { page, limit: 15 } });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/api/admin/contacts/${id}`);
      toast.success('Message deleted');
      fetchContacts();
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Contact Messages</h1>
          <p className="muted">
            Submissions from the website contact form · {pagination.total} total
          </p>
        </div>
      </div>

      {loading && <div className="loader">Loading messages…</div>}

      {!loading && data.length === 0 && (
        <div className="empty-state">
          <h3>No messages yet</h3>
          <p>Contact form submissions will appear here.</p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="table-wrap card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Message</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => (
                <tr key={m._id}>
                  <td>{m.name}</td>
                  <td>
                    <a href={`mailto:${m.email}`}>{m.email}</a>
                  </td>
                  <td>
                    <a href={`tel:${m.phone}`}>{m.phone}</a>
                  </td>
                  <td style={{ maxWidth: 320, whiteSpace: 'pre-wrap' }}>{m.message}</td>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(m._id)}
                    >
                      Delete
                    </button>
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
    </Layout>
  );
};

export default Contacts;
