import { useNavigate, Navigate } from 'react-router-dom';
import { useTrackStore } from '../store/useTrackStore';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const navigate = useNavigate();
  const resetProject = useTrackStore(state => state.resetProject);
  const { session, loading } = useAuth();

  const handleStartNewBeat = () => {
    resetProject(); // Limpiar el estado del proyecto anterior
    navigate('/studio');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex justify-center items-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/studio" replace />;
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-white flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <img src="/napbak app.png" alt="Napbak Logo" className="h-24 w-auto mx-auto mb-8" />
        <h1 className="text-5xl font-bold mb-4">Welcome to Napbak</h1>
        <p className="text-xl text-[#b3b3b3] mb-12">The fastest way to create your next banger.</p>
        
        <button 
          onClick={handleStartNewBeat}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-transform transform hover:scale-105 duration-200 ease-in-out shadow-lg shadow-green-500/20"
        >
          Start New Beat
        </button>
      </div>

      <div className="absolute bottom-8 text-center">
        <p className="text-[#b3b3b3]">
          <button onClick={handleGoToLogin} className="underline hover:text-white font-medium">Sign up</button> to save and sync your projects online.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
