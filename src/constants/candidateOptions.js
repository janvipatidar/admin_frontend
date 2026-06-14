export const EDUCATION_OPTIONS = ['10th', '12th', 'Graduation', 'Post Graduation'];

export const NOTICE_PERIOD_OPTIONS = [
  'Immediate',
  '15 Days',
  '30 Days',
  '45 Days',
  '60 Days',
  '90 Days',
  'More than 90 Days'
];

export const INDUSTRY_OPTIONS = [
  'Sales/Marketing',
  'Banking/Finance',
  'Life Insurance',
  'Health Insurance',
  'General Insurance',
  'FMCG',
  'Admin',
  'Operation',
  'HR',
  'Other'
];

/** Include legacy DB values in dropdown so edit/view flows keep working */
export const withLegacyOption = (options, value) => {
  const v = String(value || '').trim();
  if (v && !options.some((o) => o.toLowerCase() === v.toLowerCase())) {
    return [v, ...options];
  }
  return options;
};

export const COMMENT_SUGGESTED_TAGS = [
  'Expected Salary',
  'Current Salary',
  'Notice Period',
  'Relevant Experience',
  'Willing to Relocate'
];
