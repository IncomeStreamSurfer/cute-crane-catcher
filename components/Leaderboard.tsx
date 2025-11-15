import React, { useState, useEffect } from 'react';

interface HighScore {
  id: number;
  player_name: string;
  score: number;
  created_at: string;
}

export const Leaderboard: React.FC = () => {
  const [scores, setScores] = useState<HighScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const response = await fetch('/.netlify/functions/get-scores');
      if (!response.ok) throw new Error('Failed to fetch scores');
      const data = await response.json();
      setScores(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Unable to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/90 rounded-lg p-6 shadow-lg max-w-md w-full">
        <h2 className="text-3xl text-pink-600 text-shadow-cute mb-4 text-center">Global High Scores</h2>
        <p className="text-center text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 rounded-lg p-6 shadow-lg max-w-md w-full">
        <h2 className="text-3xl text-pink-600 text-shadow-cute mb-4 text-center">Global High Scores</h2>
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 rounded-lg p-6 shadow-lg max-w-md w-full">
      <h2 className="text-3xl text-pink-600 text-shadow-cute mb-4 text-center">🏆 Global High Scores 🏆</h2>
      {scores.length === 0 ? (
        <p className="text-center text-gray-600">No scores yet. Be the first!</p>
      ) : (
        <div className="space-y-2">
          {scores.map((score, index) => (
            <div
              key={score.id}
              className={`flex items-center justify-between p-3 rounded-md ${
                index === 0
                  ? 'bg-yellow-200 border-2 border-yellow-400'
                  : index === 1
                  ? 'bg-gray-200 border-2 border-gray-400'
                  : index === 2
                  ? 'bg-orange-200 border-2 border-orange-400'
                  : 'bg-pink-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-700 w-8">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <span className="font-semibold text-gray-800">{score.player_name}</span>
              </div>
              <span className="text-xl font-bold text-green-600">{score.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
