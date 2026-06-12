import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

// ─── Mock @getbrevo/brevo ─────────────────────────────────────────────────────
// Le client est instancié dans le corps de la classe, pas via injection
// → on mock le module entier pour intercepter new Brevo.BrevoClient()

const mockSendTransacEmail = jest.fn().mockResolvedValue({});

jest.mock('@getbrevo/brevo', () => ({
  BrevoClient: jest.fn().mockImplementation(() => ({
    transactionalEmails: {
      sendTransacEmail: mockSendTransacEmail,
    },
  })),
}));

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── sendInvitation ───────────────────────────────────────────────────────────

  describe('sendInvitation', () => {
    it('should call sendTransacEmail with correct recipient', async () => {
      await service.sendInvitation('bob@test.com', 'abc123token');

      expect(mockSendTransacEmail).toHaveBeenCalledTimes(1);
      expect(mockSendTransacEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{ email: 'bob@test.com' }],
        }),
      );
    });

    it('should include the activation token in the email link', async () => {
      await service.sendInvitation('bob@test.com', 'abc123token');

      const callArg = mockSendTransacEmail.mock.calls[0][0];
      expect(callArg.htmlContent).toContain('abc123token');
    });

    it('should include sender info from environment', async () => {
      await service.sendInvitation('bob@test.com', 'abc123token');

      const callArg = mockSendTransacEmail.mock.calls[0][0];
      expect(callArg.sender).toHaveProperty('email');
      expect(callArg.sender).toHaveProperty('name');
    });

    it('should propagate error when Brevo API fails', async () => {
      mockSendTransacEmail.mockRejectedValueOnce(new Error('Brevo API error'));

      await expect(
        service.sendInvitation('bob@test.com', 'abc123token'),
      ).rejects.toThrow('Brevo API error');
    });
  });
});