import { resolveToolGroup } from './modules.helpers';

const base = {
  id: 1,
  name: 'Tool',
  createdAt: new Date('2024-01-01'),
};

describe('resolveToolGroup', () => {
  // ───────── WORK ─────────

  it('WORK sans soumission → UNTOUCHED + dueDate', () => {
    const dueDate = new Date('2024-02-01');

    const tool = {
      ...base,
      type: 'WORK',
      work: { dueDate, submissions: [] },
    };

    const result = resolveToolGroup(tool as any);

    expect(result.state).toBe('UNTOUCHED');
    expect(result.date).toEqual(dueDate);
  });

  it('WORK avec soumission → SUBMITTED + submittedAt (prioritaire sur dueDate)', () => {
    const date = new Date();

    const tool = {
      ...base,
      type: 'WORK',
      work: {
        dueDate: new Date('2024-01-10'),
        submissions: [{ submittedAt: date }],
      },
    };

    const result = resolveToolGroup(tool as any);

    expect(result.state).toBe('SUBMITTED');
    expect(result.date).toEqual(date);
  });

  // ───────── FORM ─────────

  it('FORM sans soumission → UNTOUCHED + dueDate', () => {
    const dueDate = new Date('2024-03-01');

    const tool = {
      ...base,
      type: 'FORM',
      form: { dueDate, submissions: [] },
    };

    const result = resolveToolGroup(tool as any);

    expect(result.state).toBe('UNTOUCHED');
    expect(result.date).toEqual(dueDate);
  });

  it('FORM avec soumission → SUBMITTED + submittedAt', () => {
    const submittedAt = new Date();

    const tool = {
      ...base,
      type: 'FORM',
      form: {
        dueDate: null,
        submissions: [{ submittedAt }],
      },
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
      activity: { startDateTime: start },
    };

    const result = resolveToolGroup(tool as any);

    expect(result.date).toEqual(start);
  });

  it('ACTIVITY sans date → createdAt fallback', () => {
    const tool = {
      ...base,
      type: 'ACTIVITY',
      activity: { startDateTime: null },
    };

    const result = resolveToolGroup(tool as any);

    expect(result.date).toEqual(base.createdAt);
  });

  // ───────── ASSESSMENT ─────────

  it('ASSESSMENT avec feedback → statut du feedback', () => {
    const feedbackDate = new Date();

    const tool = {
      ...base,
      type: 'ASSESSMENT',
      assessmentGrid: {
        feedbacks: [{ status: 'PUBLISHED', createdAt: feedbackDate }],
      },
    };

    const result = resolveToolGroup(tool as any);

    expect(result.state).toBe('PUBLISHED');
    expect(result.date).toEqual(feedbackDate);
  });

  it('ASSESSMENT sans feedback → PENDING + createdAt', () => {
    const tool = {
      ...base,
      type: 'ASSESSMENT',
      assessmentGrid: {
        feedbacks: [],
      },
    };

    const result = resolveToolGroup(tool as any);

    expect(result.state).toBe('PENDING');
    expect(result.date).toEqual(base.createdAt);
  });

  // ───────── ToolLink ─────────

  it('lien sortant (linksAsSource) → linkedToolId = targetToolId', () => {
    const tool = {
      ...base,
      type: 'WORK',
      work: { dueDate: null, submissions: [] },
      linksAsSource: [{ targetToolId: 42 }],
      linksAsTarget: [],
    };

    const result = resolveToolGroup(tool as any);

    expect(result.linkedToolId).toBe(42);
  });

  it('lien entrant (linksAsTarget) → linkedToolId = sourceToolId', () => {
    const tool = {
      ...base,
      type: 'ASSESSMENT',
      assessmentGrid: { feedbacks: [] },
      linksAsSource: [],
      linksAsTarget: [{ sourceToolId: 7 }],
    };

    const result = resolveToolGroup(tool as any);

    expect(result.linkedToolId).toBe(7);
  });

  it('aucun lien → linkedToolId undefined', () => {
    const tool = {
      ...base,
      type: 'ACTIVITY',
      activity: { startDateTime: null },
    };

    const result = resolveToolGroup(tool as any);

    expect(result.linkedToolId).toBeUndefined();
  });
});
