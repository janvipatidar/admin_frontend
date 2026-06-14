import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import api from '../api/api';
import { COMMENT_SUGGESTED_TAGS } from '../constants/candidateOptions';
import { formatDateTime, formatRelativeTime } from '../utils/relativeTime';

const getCurrentAdminEmail = () => {
  try {
    const raw = localStorage.getItem('admin');
    if (!raw) return '';
    return JSON.parse(raw).email || '';
  } catch {
    return '';
  }
};

const displayAuthor = (createdBy, currentEmail) => {
  if (!createdBy) return 'Admin';
  if (currentEmail && createdBy.toLowerCase() === currentEmail.toLowerCase()) {
    return 'You';
  }
  return createdBy;
};

const CandidateComments = ({ candidateId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState('');
  const [showForm, setShowForm] = useState(true);
  const currentEmail = getCurrentAdminEmail();

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/candidate/${candidateId}/comments`);
      setComments(res.data.data || []);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const insertTag = (tag) => {
    const tagText = `#${tag.replace(/\s+/g, '')}`;
    setText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${tagText}` : tagText;
    });
  };

  const handlePost = async () => {
    const comment = text.trim();
    if (!comment) {
      toast.error('Enter a comment before posting');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      comment,
      createdBy: currentEmail || 'You',
      createdAt: new Date().toISOString(),
      _optimistic: true
    };

    setComments((prev) => [optimistic, ...prev]);
    setText('');
    setPosting(true);

    try {
      const res = await api.post(`/api/admin/candidate/${candidateId}/comments`, { comment });
      const saved = res.data.comment;
      setComments((prev) => prev.map((c) => (c._id === tempId ? saved : c)));
      toast.success('Comment posted');
      setShowForm(false);
    } catch (err) {
      setComments((prev) => prev.filter((c) => c._id !== tempId));
      setText(comment);
      const msg =
        (err.response && err.response.data && err.response.data.message) ||
        'Failed to post comment';
      toast.error(msg);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    const prev = comments;
    setComments((list) => list.filter((c) => c._id !== commentId));
    try {
      await api.delete(`/api/admin/candidate/comments/${commentId}`);
      toast.success('Comment deleted');
    } catch {
      setComments(prev);
      toast.error('Failed to delete comment');
    }
  };

  const count = comments.length;
  const hasComments = count > 0;

  return (
    <div className="card comments-card">
      <div className="comments-header">
        <h3>{hasComments ? `${count} Comment${count === 1 ? '' : 's'}` : 'No comments'}</h3>
        {hasComments && !showForm && (
          <button type="button" className="link-btn" onClick={() => setShowForm(true)}>
            Add comments
          </button>
        )}
      </div>

      {loading ? (
        <div className="comments-loading muted">Loading comments…</div>
      ) : (
        <>
          {hasComments && (
            <ul className="comments-list">
              {comments.map((c) => (
                <li key={c._id} className="comment-item">
                  <div className="comment-avatar" aria-hidden="true">
                    {(displayAuthor(c.createdBy, currentEmail)[0] || 'A').toUpperCase()}
                  </div>
                  <div className="comment-body">
                    <p className="comment-text">{c.comment}</p>
                    <div className="comment-meta">
                      <span>
                        by {displayAuthor(c.createdBy, currentEmail)}
                        {' · '}
                        {formatRelativeTime(c.createdAt)}
                      </span>
                      <span className="comment-datetime" title={formatDateTime(c.createdAt)}>
                        {formatDateTime(c.createdAt)}
                      </span>
                    </div>
                    {!c._optimistic && (
                      <button
                        type="button"
                        className="comment-delete link-btn"
                        onClick={() => handleDelete(c._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {(showForm || !hasComments) && (
            <div className="comment-compose">
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Use '@' to mention team members and '#' to add tags"
                disabled={posting}
              />
              <div className="comment-tags">
                <span className="comment-tags-label">Suggested Tags</span>
                <div className="comment-tag-row">
                  {COMMENT_SUGGESTED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="comment-tag"
                      onClick={() => insertTag(tag)}
                      disabled={posting}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="comment-compose-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePost}
                  disabled={posting || !text.trim()}
                >
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CandidateComments;
