import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('should throw when JWT_SECRET is not set (refuses to start insecurely)', () => {
    delete process.env.JWT_SECRET;

    expect(() => new JwtStrategy()).toThrow('JWT_SECRET must be set');
  });

  it('should construct successfully when JWT_SECRET is set', () => {
    process.env.JWT_SECRET = 'test-secret';

    expect(() => new JwtStrategy()).not.toThrow();
  });

  describe('cookie extraction', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = 'test-secret';
    });

    it('should extract the token from the access_token cookie', () => {
      const strategy = new JwtStrategy();
      const extractor = (strategy as any)._jwtFromRequest;

      const token = extractor({
        cookies: { access_token: 'jwt-value' },
      } as any);

      expect(token).toBe('jwt-value');
    });

    it('should return null when there is no access_token cookie', () => {
      const strategy = new JwtStrategy();
      const extractor = (strategy as any)._jwtFromRequest;

      const token = extractor({ cookies: {} } as any);

      expect(token).toBeNull();
    });

    it('should return null when the request has no cookies at all', () => {
      const strategy = new JwtStrategy();
      const extractor = (strategy as any)._jwtFromRequest;

      const token = extractor({} as any);

      expect(token).toBeNull();
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = 'test-secret';
    });

    it('should map the JWT payload to the request user', async () => {
      const strategy = new JwtStrategy();

      const result = await strategy.validate({
        sub: 1,
        email: 'alice@test.com',
        roles: ['STUDENT'],
      });

      expect(result).toEqual({
        userId: 1,
        email: 'alice@test.com',
        roles: ['STUDENT'],
      });
    });

    it('should default roles to an empty array when absent from the payload', async () => {
      const strategy = new JwtStrategy();

      const result = await strategy.validate({
        sub: 1,
        email: 'alice@test.com',
      });

      expect(result.roles).toEqual([]);
    });
  });
});
