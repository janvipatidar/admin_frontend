import React, { useState } from 'react';

const TagInput = ({
  tags,
  onChange,
  placeholder = 'Type and press Enter',
  highlightFirst = false
}) => {
  const [input, setInput] = useState('');

  const addTag = (raw) => {
    const value = String(raw || '').trim();
    if (!value) return;
    if (!tags.includes(value)) onChange([...tags, value]);
    setInput('');
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="rdx-tag-input">
      {tags.map((tag, i) => (
        <span
          key={tag}
          className={'rdx-tag' + (highlightFirst && i === 0 ? ' rdx-tag-star' : '')}
        >
          {highlightFirst && i === 0 && <span className="rdx-tag-icon">★</span>}
          {tag}
          <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => addTag(input)}
        placeholder={tags.length ? 'Type another keyword' : placeholder}
      />
    </div>
  );
};

export default TagInput;
