import React from 'react';
import { useRouter } from 'next/navigation';

interface InstrumentPageProps {
  name: string;
  id: string;
}

const InstrumentPage: React.FC<InstrumentPageProps> = ({ name, id }) => {
  const router = useRouter();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{name}</h1>
      <p>Instrument ID: {id}</p>
      {/* Add more instrument details here as needed */}
      <button onClick={() => router.back()} style={{ marginTop: '2rem' }}>
        Back
      </button>
    </div>
  );
};

export default InstrumentPage;
