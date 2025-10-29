import { loginWithEmail, registerCandidateWithEmail, sendMagicLink } from '../service';

const createSupabaseMock = () => {
  const singleMock = jest.fn();
  const eqMock = jest.fn(() => ({ single: singleMock }));
  const selectMock = jest.fn(() => ({ eq: eqMock }));
  const insertMock = jest.fn();

  return {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      signInWithOtp: jest.fn(),
    },
    from: jest.fn(() => ({
      select: selectMock,
      eq: eqMock,
      single: singleMock,
      insert: insertMock,
    })),
    _mocks: {
      selectMock,
      eqMock,
      singleMock,
      insertMock,
    },
  };
};

describe('loginWithEmail', () => {
  it('returns redirect information when credentials and role are valid', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    supabase._mocks.singleMock.mockResolvedValue({
      data: { role: 'admin' },
      error: null,
    });

    const result = await loginWithEmail({
      supabase: supabase as any,
      email: 'admin@example.com',
      password: 'password',
      expectedRole: 'admin',
    });

    expect(result).toEqual({
      success: true,
      redirect: '/admin',
      role: 'admin',
    });
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('rejects access when user role is not permitted', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-2' } },
      error: null,
    });
    supabase._mocks.singleMock.mockResolvedValue({
      data: { role: 'candidate' },
      error: null,
    });

    const result = await loginWithEmail({
      supabase: supabase as any,
      email: 'candidate@example.com',
      password: 'password',
      expectedRole: 'admin',
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      message: expect.stringContaining('Access denied'),
    });
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('returns error message when sign-in fails', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    });

    const result = await loginWithEmail({
      supabase: supabase as any,
      email: 'foo@example.com',
      password: 'bad',
      expectedRole: 'admin',
    });

    expect(result).toEqual({
      success: false,
      message: 'Invalid credentials',
    });
  });
});

describe('registerCandidateWithEmail', () => {
  it('creates a candidate profile when sign up succeeds', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'new-user' } },
      error: null,
    });
    supabase._mocks.singleMock.mockResolvedValue({
      data: null,
      error: null,
    });
    supabase._mocks.insertMock.mockResolvedValue({
      error: null,
    });

    const result = await registerCandidateWithEmail({
      supabase: supabase as any,
      email: 'newuser@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    expect(supabase._mocks.insertMock).toHaveBeenCalledWith({
      id: 'new-user',
      full_name: 'newuser',
      email: 'newuser@example.com',
      role: 'candidate',
    });
  });

  it('returns an error when Supabase sign-up fails', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'Email already registered' },
    });

    const result = await registerCandidateWithEmail({
      supabase: supabase as any,
      email: 'exists@example.com',
      password: 'password123',
    });

    expect(result).toEqual({
      success: false,
      message: 'Email already registered',
    });
  });

  it('propagates profile insertion errors', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'new-user' } },
      error: null,
    });
    supabase._mocks.singleMock.mockResolvedValue({
      data: null,
      error: null,
    });
    supabase._mocks.insertMock.mockResolvedValue({
      error: { message: 'Insert failed' },
    });

    const result = await registerCandidateWithEmail({
      supabase: supabase as any,
      email: 'problem@example.com',
      password: 'password123',
    });

    expect(result).toEqual({
      success: false,
      message: 'Insert failed',
    });
  });
});

describe('sendMagicLink', () => {
  it('delegates to supabase otp sign-in', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signInWithOtp.mockResolvedValue({ data: {}, error: null });

    const result = await sendMagicLink({
      supabase: supabase as any,
      email: 'user@example.com',
    });

    expect(result).toEqual({
      success: true,
      message: 'Link login terkirim ke email kamu.',
    });
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: {
        emailRedirectTo: undefined,
      },
    });
  });
});
