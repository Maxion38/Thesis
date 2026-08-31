import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockUsersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findFirstProject: jest.fn(),
};

// Simule l'objet req avec le user injecté par le JWT guard
const mockRequest = {
  user: { userId: 1 },
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll and return results', async () => {
      mockUsersService.findAll.mockResolvedValue([{ id: 1 }]);

      const result = await controller.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('findMyProject', () => {
    it('should call service.findFirstProject with userId from request', async () => {
      mockUsersService.findFirstProject.mockResolvedValue({
        id: 42,
        title: 'Mon TFE',
      });

      const result = await controller.findMyProject(mockRequest as any);

      // Vérifie que le userId est bien extrait de req.user
      expect(mockUsersService.findFirstProject).toHaveBeenCalledWith(
        1,
        undefined,
      );
      expect(result).toEqual({ id: 42, title: 'Mon TFE' });
    });

    it('should forward an explicit trainingCourseId query param', async () => {
      mockUsersService.findFirstProject.mockResolvedValue({
        id: 42,
        title: 'Mon TFE',
      });

      await controller.findMyProject(mockRequest as any, '7');

      expect(mockUsersService.findFirstProject).toHaveBeenCalledWith(1, 7);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with parsed id', async () => {
      mockUsersService.findOne.mockReturnValue('This action returns a #3 user');

      const result = await controller.findOne('3');

      expect(mockUsersService.findOne).toHaveBeenCalledWith(3);
      expect(result).toBe('This action returns a #3 user');
    });
  });
});
