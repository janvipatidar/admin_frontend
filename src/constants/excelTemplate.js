export const EXCEL_SHEET_NAME = 'Candidates';

export const EXCEL_COLUMNS = [
  'Candidate ID',
  'Name',
  'Email',
  'Phone',
  'Designation',
  'Current CTC',
  'Education',
  'Experience (yrs)',
  'Notice Period',
  'Current Employer',
  'Previous Employer',
  'Industry',
  'State',
  'City',
  'Location',
  'Expected Salary',
  'Skills',
  'Status',
  'Active',
  'Resume',
  'Created At'
];

export const candidateToExportRow = (c) => ({
  'Candidate ID': c._id || '',
  Name: c.name || '',
  Email: c.email || '',
  Phone: c.phone || '',
  Designation: c.designation || '',
  'Current CTC': c.currentCTC != null ? c.currentCTC : '',
  Education: c.education || '',
  'Experience (yrs)': c.experience != null ? c.experience : '',
  'Notice Period': c.noticePeriod || '',
  'Current Employer': c.currentEmployer || '',
  'Previous Employer': c.previousEmployer || '',
  Industry: c.currentIndustry || '',
  State: c.state || '',
  City: c.city || '',
  Location: c.location || '',
  'Expected Salary': c.expectedSalary != null ? c.expectedSalary : '',
  Skills: Array.isArray(c.keySkills) ? c.keySkills.join(', ') : '',
  Status: c.status || '',
  Active: c.isActive ? 'Yes' : 'No',
  Resume: c.resumeUrl || '',
  'Created At': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
});
