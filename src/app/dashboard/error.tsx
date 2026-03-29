"use client";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <span className="text-5xl mb-4">⚠️</span>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-gray-400 mb-4 max-w-md">{error.message || "An unexpected error occurred. Please try again."}</p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
      >
        Try Again
      </button>
    </div>
  );
}
