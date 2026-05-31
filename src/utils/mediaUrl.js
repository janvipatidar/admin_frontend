export const getApiBase = () =>
  String(process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export const getResumeUrl = (resumeUrl) => {
  if (!resumeUrl) return '';
  if (/^https?:\/\//i.test(resumeUrl)) return resumeUrl;
  const base = getApiBase();
  const path = resumeUrl.startsWith('/') ? resumeUrl : `/${resumeUrl}`;
  return `${base}${path}`;
};

export const getResumeFileName = (resumeUrl) => {
  if (!resumeUrl) return '';
  const parts = resumeUrl.split('/');
  return parts[parts.length - 1] || 'Resume';
};
