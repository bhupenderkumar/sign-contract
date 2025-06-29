import { useState, useEffect } from 'react';

const BackendStatus = () => {
  const [isBackendRunning, setIsBackendRunning] = useState(false);

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          setIsBackendRunning(true);
        } else {
          setIsBackendRunning(false);
        }
      } catch (error) {
        setIsBackendRunning(false);
      }
    };

    const interval = setInterval(checkBackendStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg">
      <p>Backend Status: {isBackendRunning ? 'Running' : 'Not Running'}</p>
    </div>
  );
};

export default BackendStatus;
