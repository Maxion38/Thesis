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

  // ───────── WORK ─────────

  it('WORK sans soumission → UNTOUCHED', () => {
    const tool = {
      ...base,
      type: 'WORK',
      works: [{ dueDate: null, userWorkSubmissions: [] }],
    };

    const result = resolveToolGroup(tool as any);
    expect(result.state).toBe('UNTOUCHED');
  });

  it('WORK avec soumission → SUBMITTED + date OK', () => {
    const date = new Date();

    const tool = {
      ...base,
      type: 'WORK',
      works: [
        {
          dueDate: new Date('2024-01-10'),
          userWorkSubmissions: [{ submittedAt: date }],
        },
      ],
    };

    const result = resolveToolGroup(tool as any);

    expect(result.state).toBe('SUBMITTED');
    expect(result.date).toEqual(new Date('2024-01-10')); // dueDate prioritaire
  });

  // ───────── FORM ─────────

  it('FORM sans soumission → UNTOUCHED + createdAt', () => {
    const tool = {
      ...base,
      type: 'FORM',
      forms: [{ submissions: [] }],
    };

    const result = resolveToolGroup(tool as any);

    expect(result.state).toBe('UNTOUCHED');
    expect(result.date).toEqual(base.createdAt);
  });

  it('FORM avec soumission → SUBMITTED + submittedAt', () => {
    const submittedAt = new Date();

    const tool = {
      ...base,
      type: 'FORM',
      forms: [
        {
          submissions: [{ submittedAt }],
        },
      ],
    };

    const result = resolveToolGroup(tool as any);

    expect(result.state).toBe('SUBMITTED');
    expect(result.date).toEqual(submittedAt);
  });

  // ───────── ACTIVITY ─────────

  it('ACTIVITY → startDateTime ou createdAt', () => {
    const start = new Date();

    const tool = {
      ...base,
      type: 'ACTIVITY',
      activities: [{ startDateTime: start }],
    };

    const result = resolveToolGroup(tool as any);

    expect(result.date).toEqual(start);
  });

  it('ACTIVITY sans date → createdAt fallback', () => {
    const tool = {
      ...base,
      type: 'ACTIVITY',
      activities: [{ startDateTime: null }],
    };

    const result = resolveToolGroup(tool as any);

    expect(result.date).toEqual(base.createdAt);
  });

  // ───────── ASSESSMENT ─────────

  it('ASSESSMENT avec feedback → CORRECTED', () => {
    const feedbackDate = new Date();

    const tool = {
      ...base,
      type: 'ASSESSMENT',
      assessmentGrids: [
        {
          gridVersions: [
            {
              feedbacks: [{ createdAt: feedbackDate }],
            },
          ],
        },
      ],
    };

    const result = resolveToolGroup(tool as any);

    expect(result.state).toBe('CORRECTED');
    expect(result.date).toEqual(feedbackDate);
  });

  it('ASSESSMENT sans feedback → UNTOUCHED + createdAt', () => {
    const tool = {
      ...base,
      type: 'ASSESSMENT',
      assessmentGrids: [
        {
          gridVersions: [
            {
              feedbacks: [],
            },
          ],
        },
      ],
    };

    const result = resolveToolGroup(tool as any);

    expect(result.state).toBe('UNTOUCHED');
    expect(result.date).toEqual(base.createdAt);
  });
});