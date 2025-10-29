import ApplicationSuccessPage from '@/components/jobs/ApplicationSuccessPage';

export default function SuccessApplyPage({ params }: any) {
  return <ApplicationSuccessPage jobId={params.id} />;
}
