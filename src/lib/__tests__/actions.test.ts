import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getCandidatesByJobId,
  applyForJob,
} from '../actions';

jest.mock('../supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const { createClient } = require('../supabase/server');
const { revalidatePath } = require('next/cache');

const createSupabaseServerMock = () => {
  const jobsInsert = jest.fn().mockResolvedValue({ error: null });
  const jobsUpdateEq = jest.fn().mockResolvedValue({ error: null });
  const jobsUpdate = jest.fn(() => ({ eq: jobsUpdateEq }));
  const jobsDeleteEq = jest.fn().mockResolvedValue({ error: null });
  const jobsDelete = jest.fn(() => ({ eq: jobsDeleteEq }));
  const candidatesInsert = jest.fn().mockResolvedValue({ error: null });

  const supabase = {
    from: jest.fn((table: string) => {
      if (table === 'jobs') {
        return {
          insert: jobsInsert,
          update: jobsUpdate,
          delete: jobsDelete,
        };
      }
      if (table === 'candidates') {
        return {
          insert: candidatesInsert,
        };
      }
      return {};
    }),
  };

  return {
    supabase,
    jobsInsert,
    jobsUpdateEq,
    jobsDeleteEq,
    candidatesInsert,
  };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('job query actions', () => {
  it('fetches jobs ordered by creation date', async () => {
    const jobs = [{ id: 'job-1' }, { id: 'job-2' }];
    const orderMock = jest.fn().mockResolvedValue({ data: jobs, error: null });
    const selectMock = jest.fn(() => ({ order: orderMock }));
    const supabase = {
      from: jest.fn(() => ({
        select: selectMock,
      })),
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const result = await getJobs();

    expect(result).toEqual({
      data: jobs,
      error: null,
    });
    expect(supabase.from).toHaveBeenCalledWith('jobs');
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('propagates errors when job list fetch fails', async () => {
    const orderMock = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('Unable to load jobs'),
    });
    const selectMock = jest.fn(() => ({ order: orderMock }));
    const supabase = {
      from: jest.fn(() => ({
        select: selectMock,
      })),
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const result = await getJobs();

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: 'Unable to load jobs' });
  });

  it('retrieves a single job by id', async () => {
    const job = { id: 'job-123', title: 'Product Manager' };
    const singleMock = jest.fn().mockResolvedValue({ data: job, error: null });
    const eqMock = jest.fn(() => ({ single: singleMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));
    const supabase = {
      from: jest.fn(() => ({
        select: selectMock,
      })),
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const result = await getJobById('job-123');

    expect(result).toEqual({
      data: job,
      error: null,
    });
    expect(supabase.from).toHaveBeenCalledWith('jobs');
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(eqMock).toHaveBeenCalledWith('id', 'job-123');
  });

  it('returns an error when job lookup fails', async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('Job not found'),
    });
    const eqMock = jest.fn(() => ({ single: singleMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));
    const supabase = {
      from: jest.fn(() => ({
        select: selectMock,
      })),
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const result = await getJobById('missing-job');

    expect(result).toEqual({
      data: null,
      error: { message: 'Job not found' },
    });
  });
});

describe('admin job actions', () => {
  it('creates a job and triggers revalidation', async () => {
    const { supabase, jobsInsert } = createSupabaseServerMock();
    (createClient as jest.Mock).mockReturnValue(supabase);

    const formData = new FormData();
    formData.append('title', 'Frontend Engineer');
    formData.append('department', 'Engineering');
    formData.append('salary_min', '1000');
    formData.append('salary_max', '2000');
    formData.append('status', 'active');
    formData.append('application_form', JSON.stringify({ fields: [] }));

    const result = await createJob(formData);

    expect(result).toEqual({
      data: { message: 'Job created successfully' },
      error: null,
    });
    expect(jobsInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        title: 'Frontend Engineer',
        department: 'Engineering',
      }),
    ]);
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
    expect(revalidatePath).toHaveBeenCalledWith('/jobs');
  });

  it('updates a job by id', async () => {
    const { supabase, jobsUpdateEq } = createSupabaseServerMock();
    (createClient as jest.Mock).mockReturnValue(supabase);

    const formData = new FormData();
    formData.append('title', 'Updated role');
    formData.append('department', 'Product');
    formData.append('salary_min', '1200');
    formData.append('salary_max', '2200');
    formData.append('status', 'active');
    formData.append('application_form', JSON.stringify({ fields: [] }));

    const result = await updateJob('job-123', formData);

    expect(result).toEqual({
      data: { message: 'Job updated successfully' },
      error: null,
    });
    expect(jobsUpdateEq).toHaveBeenCalledWith('id', 'job-123');
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
    expect(revalidatePath).toHaveBeenCalledWith('/jobs');
  });

  it('deletes a job by id', async () => {
    const { supabase, jobsDeleteEq } = createSupabaseServerMock();
    (createClient as jest.Mock).mockReturnValue(supabase);

    const result = await deleteJob('job-123');

    expect(result).toEqual({
      data: { message: 'Job deleted successfully' },
      error: null,
    });
    expect(jobsDeleteEq).toHaveBeenCalledWith('id', 'job-123');
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
    expect(revalidatePath).toHaveBeenCalledWith('/jobs');
  });
});

describe('candidate actions', () => {
  it('fetches candidates for a job', async () => {
    const candidates = [{ id: 'candidate-1' }, { id: 'candidate-2' }];
    const orderMock = jest.fn().mockResolvedValue({ data: candidates, error: null });
    const eqMock = jest.fn(() => ({ order: orderMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));
    const supabase = {
      from: jest.fn(() => ({
        select: selectMock,
      })),
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const result = await getCandidatesByJobId('job-456');

    expect(result).toEqual({
      data: candidates,
      error: null,
    });
    expect(supabase.from).toHaveBeenCalledWith('candidates');
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(eqMock).toHaveBeenCalledWith('job_id', 'job-456');
    expect(orderMock).toHaveBeenCalledWith('applied_at', { ascending: false });
  });

  it('propagates errors when candidate fetch fails', async () => {
    const orderMock = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('Query failed'),
    });
    const eqMock = jest.fn(() => ({ order: orderMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));
    const supabase = {
      from: jest.fn(() => ({
        select: selectMock,
      })),
    };
    (createClient as jest.Mock).mockReturnValue(supabase);

    const result = await getCandidatesByJobId('job-456');

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: 'Query failed' });
  });

  it('submits an application with dynamic fields', async () => {
    const { supabase, candidatesInsert } = createSupabaseServerMock();
    (createClient as jest.Mock).mockReturnValue(supabase);

    const formData = new FormData();
    formData.append('job_id', 'job-456');
    formData.append('full_name', 'Jane Doe');
    formData.append('email', 'jane@example.com');
    formData.append('custom_field', 'custom value');

    const result = await applyForJob(formData);

    expect(result).toEqual({
      data: { message: 'Application submitted successfully!' },
      error: null,
    });
    expect(candidatesInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        job_id: 'job-456',
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        details: {
          custom_field: 'custom value',
        },
      }),
    ]);
    expect(revalidatePath).toHaveBeenCalledWith('/admin/job-456/candidates');
  });
});
