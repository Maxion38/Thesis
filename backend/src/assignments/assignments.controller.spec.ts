import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockAssignmentsService = {
  getAssignedUsers: jest.fn(),
  getAssignableUsers: jest.fn(),
  assignUsersToTrainingCourse: jest.fn(),
  unassignUsersFromTrainingCourse: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AssignmentsController', () => {
  let controller: AssignmentsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [
        { provide: AssignmentsService, useValue: mockAssignmentsService },
      ],
    }).compile();

    controller = module.get<AssignmentsController>(AssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAssignedUsers', () => {
    it('should call service with parsed trainingCourseId', async () => {
      mockAssignmentsService.getAssignedUsers.mockResolvedValue([]);

      await controller.getAssignedUsers('5');

      // Vérifie que le string '5' est converti en number
      expect(mockAssignmentsService.getAssignedUsers).toHaveBeenCalledWith(5);
    });
  });

  describe('getAssignableUsers', () => {
    it('should call service with parsed trainingCourseId', async () => {
      mockAssignmentsService.getAssignableUsers.mockResolvedValue([]);

      await controller.getAssignableUsers('5');

      expect(mockAssignmentsService.getAssignableUsers).toHaveBeenCalledWith(5);
    });
  });

  describe('assignUsers', () => {
    it('should call service with parsed id and userIds from body', async () => {
      mockAssignmentsService.assignUsersToTrainingCourse.mockResolvedValue({
        created: 2,
        skipped: 0,
      });

      const result = await controller.assignUsers('1', { userIds: [10, 11] });

      expect(
        mockAssignmentsService.assignUsersToTrainingCourse,
      ).toHaveBeenCalledWith(1, [10, 11]);
      expect(result).toEqual({ created: 2, skipped: 0 });
    });
  });

  describe('unassignUsers', () => {
    it('should call service with parsed id and userIds from body', async () => {
      mockAssignmentsService.unassignUsersFromTrainingCourse.mockResolvedValue({
        removedUserIds: [10],
      });

      const result = await controller.unassignUsers('1', { userIds: [10] });

      expect(
        mockAssignmentsService.unassignUsersFromTrainingCourse,
      ).toHaveBeenCalledWith(1, [10]);
      expect(result).toEqual({ removedUserIds: [10] });
    });
  });
});
