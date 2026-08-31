export const mockPrismaService = {
    module:          { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    tool:            { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    user:            { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(), },
    trainingCourse:  { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    project:         { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    work:            { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    userWorkSubmission:   { create: jest.fn(), count: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), delete: jest.fn(), },
    invitation:      { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), },
    refreshToken:    { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn(), },
    $transaction:    jest.fn(),
};