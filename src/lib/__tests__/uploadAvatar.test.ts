describe('uploadAvatar action', () => {
  let uploadAvatar: typeof import('../actions')['uploadAvatar'];
  let createClientMock: jest.Mock;
  let createSupabaseAdminClientMock: jest.Mock;
  let adminStorage: {
    listBuckets: jest.Mock;
    createBucket: jest.Mock;
    from: jest.Mock;
  };

  beforeEach(() => {
    jest.resetModules();

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET = 'avatars';

    adminStorage = {
      listBuckets: jest.fn(),
      createBucket: jest.fn(),
      from: jest.fn(),
    };

    const adminClient = {
      storage: adminStorage,
    };

    jest.doMock('../supabase/server', () => {
      const createClient = jest.fn();
      return { createClient };
    });

    jest.doMock('next/cache', () => ({
      revalidatePath: jest.fn(),
    }));

    createSupabaseAdminClientMock = jest.fn(() => adminClient);

    jest.doMock('@supabase/supabase-js', () => ({
      createClient: createSupabaseAdminClientMock,
    }));

    ({ uploadAvatar } = require('../actions'));
    ({ createClient: createClientMock } = require('../supabase/server'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('returns an error when no file is provided', async () => {
    createClientMock.mockReturnValue({
      storage: { from: jest.fn() },
      from: jest.fn(),
    });

    const formData = new FormData();
    const result = await uploadAvatar(formData);

    expect(result).toEqual({
      data: null,
      error: { message: 'No file provided' },
    });
    expect(createClientMock).toHaveBeenCalled();
  });

  it('uploads an avatar and returns the public URL', async () => {
    const uploadMock = jest.fn().mockResolvedValue({ error: null });
    const getPublicUrlMock = jest.fn(() => ({
      data: { publicUrl: 'https://cdn.example.com/avatar.png' },
      error: null,
    }));

    adminStorage.listBuckets.mockResolvedValue({
      data: [{ name: 'avatars' }],
      error: null,
    });
    adminStorage.from.mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    });

    createClientMock.mockReturnValue({
      storage: {
        from: jest.fn(() => ({
          upload: uploadMock,
          getPublicUrl: getPublicUrlMock,
        })),
      },
      from: jest.fn(),
    });

    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1700);

    const formData = new FormData();
    formData.append('file', new File(['avatar'], 'My Photo.PNG', { type: 'image/png' }));

    const result = await uploadAvatar(formData);

    expect(adminStorage.listBuckets).toHaveBeenCalled();
    expect(uploadMock).toHaveBeenCalledWith(
      '1700-my-photo.png',
      expect.any(File),
      { upsert: true, cacheControl: '3600' }
    );
    expect(getPublicUrlMock).toHaveBeenCalledWith('1700-my-photo.png');
    expect(result).toEqual({
      data: { publicUrl: 'https://cdn.example.com/avatar.png' },
      error: null,
    });

    dateSpy.mockRestore();
  });

  it('returns a helpful message when the storage bucket is missing', async () => {
    const uploadMock = jest.fn().mockResolvedValue({
      error: { message: 'Bucket not found' },
    });
    const getPublicUrlMock = jest.fn();

    adminStorage.listBuckets.mockResolvedValue({
      data: [{ name: 'avatars' }],
      error: null,
    });
    adminStorage.from.mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    });

    createClientMock.mockReturnValue({
      storage: {
        from: jest.fn(() => ({
          upload: uploadMock,
          getPublicUrl: getPublicUrlMock,
        })),
      },
      from: jest.fn(),
    });

    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(42);

    const formData = new FormData();
    formData.append('file', new File(['avatar'], 'avatar.png', { type: 'image/png' }));

    const result = await uploadAvatar(formData);

    expect(result).toEqual({
      data: null,
      error: {
        message:
          'Storage bucket for avatars was not found. Please ask an administrator to create it or set NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET.',
      },
    });
    expect(getPublicUrlMock).not.toHaveBeenCalled();

    dateSpy.mockRestore();
  });
});
