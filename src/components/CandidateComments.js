import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import api from '../api/api';
import { COMMENT_SUGGESTED_TAGS } from '../constants/candidateOptions';
import { formatDateTime, formatRelativeTime } from '../utils/relativeTime';

const MAX_COMMENT_LENGTH = 5000;

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

const makeDraftComment = (text, currentEmail) => ({
  _id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  comment: text,
  createdBy: currentEmail || 'You',
  createdAt: new Date().toISOString(),
  _draft: true
});

const CandidateComments = ({
  candidateId,
  draftComments = [],
  onDraftChange,
  embedded = false
}) => {
  const isDraft = !candidateId;
  const [comments, setComments] = useState(isDraft ? draftComments : []);
  const [loading, setLoading] = useState(!isDraft);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const currentEmail = getCurrentAdminEmail();

  useEffect(() => {
    if (isDraft) {
      setComments(draftComments);
    }
  }, [isDraft, draftComments]);

  const fetchComments = useCallback(async () => {
    if (!candidateId) return;
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
    if (!isDraft) fetchComments();
  }, [isDraft, fetchComments]);

  const updateDraft = (next) => {
    setComments(next);
    if (onDraftChange) onDraftChange(next);
  };

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
    if (comment.length > MAX_COMMENT_LENGTH) {
      toast.error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
      return;
    }

    if (isDraft) {
      const next = [makeDraftComment(comment, currentEmail), ...comments];
      updateDraft(next);
      setText('');
      setShowForm(false);
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
      await fetchComments();
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

    if (isDraft) {
      updateDraft(comments.filter((c) => c._id !== commentId));
      return;
    }

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

  const startEdit = (c) => {
    setEditingId(c._id);
    setEditText(c.comment);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (commentId) => {
    const comment = editText.trim();
    if (!comment) {
      toast.error('Comment cannot be empty');
      return;
    }
    if (comment.length > MAX_COMMENT_LENGTH) {
      toast.error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
      return;
    }

    if (isDraft) {
      updateDraft(
        comments.map((c) => (c._id === commentId ? { ...c, comment } : c))
      );
      cancelEdit();
      return;
    }

    try {
      const res = await api.put(`/api/admin/candidate/comments/${commentId}`, { comment });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? res.data.comment : c))
      );
      cancelEdit();
      toast.success('Comment updated');
    } catch (err) {
      const msg =
        (err.response && err.response.data && err.response.data.message) ||
        'Failed to update comment';
      toast.error(msg);
    }
  };

  const count = comments.length;
  const hasComments = count > 0;
  const wrapperClass = embedded ? 'comments-embedded' : 'card comments-card';

  return (
    <div className={wrapperClass}>
      <div className="comments-header">
        <h3>
          {hasComments
            ? `${count} Comment${count === 1 ? '' : 's'}`
            : 'No comments yet'}
        </h3>
        {hasComments && !showForm && (
          <button type="button" className="link-btn" onClick={() => setShowForm(true)}>
            Add comment
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
                    {editingId === c._id ? (
                      <div className="comment-edit">
                        <textarea
                          rows={3}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          maxLength={MAX_COMMENT_LENGTH}
                        />
                        <div className="comment-edit-actions">
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => saveEdit(c._id)}>
                            Save
                          </button>
                          <button type="button" className="btn btn-outline btn-sm" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
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
                          <div className="comment-actions">
                            <button type="button" className="link-btn" onClick={() => startEdit(c)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="comment-delete link-btn"
                              onClick={() => handleDelete(c._id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </>
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
                placeholder="Add a comment about this candidate…"
                disabled={posting}
                maxLength={MAX_COMMENT_LENGTH}
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
