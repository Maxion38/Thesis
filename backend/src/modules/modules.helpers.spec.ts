import { resolveToolGroup } from './modules.helpers';

const base = {
  id: 1,
  name: 'Tool',
  createdAt: new Date('2024-01-01'),
  forms: [],
  works: [],
  activities: [],
  assessmentGrids: [],
};

describe('resolveToolGroup', () => {
  it('WORK sans soumission → state UNTOUCHED', () => {
    const tool = { ...base, type: 'WORK', works: [{ dueDate: null, userWorkSubmissions: [] }] };
    const result = resolveToolGroup(tool as any);
    expect(result.state).toBe('UNTOUCHED');
  });

  it('WORK avec soumission → state SUBMITTED', () => {
    const tool = {
      ...base,
      type: 'WORK',
      works: [{ dueDate: null, userWorkSubmissions: [{ submittedAt: new Date() }] }],
    };
    const result = resolveToolGroup(tool as any);
    expect(result.state).toBe('SUBMITTED');
  });

  it('FORM sans soumission → state UNTOUCHED', () => {
    const tool = { ...base, type: 'FORM', forms: [{ submissions: [] }] };
    const result = resolveToolGroup(tool as any);
    expect(result.state).toBe('UNTOUCHED');
  });

  it('ASSESSMENT avec feedback → state CORRECTED', () => {
    const tool = {
      ...base,
      type: 'ASSESSMENT',
      assessmentGrids: [{
        gridVersions: [{
          feedbacks: [{ createdAt: new Date() }],
        }],
      }],
    };
    const result = resolveToolGroup(tool as any);
    expect(result.state).toBe('CORRECTED');
  });
});