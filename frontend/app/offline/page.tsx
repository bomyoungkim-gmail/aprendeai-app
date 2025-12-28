'use client';

// Offline fallback page
export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">📴</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Você está offline</h1>
        <p className="text-gray-600 mb-6">
          Não foi possível conectar ao servidor. Verifique sua conexão com a internet.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
