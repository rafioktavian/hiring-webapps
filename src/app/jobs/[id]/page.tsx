export default function JobDetailsPage({ params }: { params: { id: string } }) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold">Job Details: {params.id}</h1>
        <p>Apply for this job here.</p>
      </div>
    );
  }
  