import React, { useState, useRef, useEffect, useCallback } from 'react';

// Sub-component for the photo booth feature
const PhotoBooth: React.FC<{ onPhotoTaken: (dataUrl: string) => void; onBack: () => void }> = ({ onPhotoTaken, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    };
    startCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // Flip the image horizontally for a mirror effect
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

    onPhotoTaken(canvas.toDataURL('image/png'));
  };

  return (
    <div className="relative w-full max-w-2xl flex flex-col items-center">
      <h3 className="text-3xl text-pink-500 mb-4">Photo Booth!</h3>
      {error ? (
        <p className="text-red-600 text-center">{error}</p>
      ) : (
        <div className="relative border-4 border-pink-400 rounded-lg overflow-hidden w-full aspect-video bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex space-x-4 mt-4">
        <button onClick={snapPhoto} disabled={!!error} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:bg-gray-500 pixel-shadow">
          USE THIS PHOTO
        </button>
        <button onClick={onBack} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md pixel-shadow">
          BACK
        </button>
      </div>
    </div>
  );
};

// Sub-component for the downloadable certificate
const Certificate: React.FC<{ score: number; photoDataUrl: string | null; certificateRef: React.RefObject<HTMLDivElement> }> = ({ score, photoDataUrl, certificateRef }) => {
    return (
        <div ref={certificateRef} className="fixed -top-[9999px] -left-[9999px] p-1">
            <div className="w-[800px] h-[600px] bg-gradient-to-br from-yellow-100 to-pink-200 p-8 border-8 border-double border-pink-400 flex flex-col items-center justify-around text-gray-800">
                <div className="text-5xl text-shadow-cute text-pink-500">Congratulations!</div>
                
                {photoDataUrl ? (
                    <div className="flex items-center gap-8">
                        <img src={photoDataUrl} alt="Player" className="w-48 h-48 object-cover rounded-full border-4 border-white shadow-lg"/>
                        <div className="text-center">
                           <div className="text-6xl font-bold text-pink-600">Cute Crane Catcher</div>
                           <div className="text-xl mt-4">This certificate is awarded for a super score of</div>
                           <div className="text-7xl font-bold text-yellow-500" style={{textShadow: '3px 3px 0px #C55C89'}}>{score}</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="text-6xl font-bold mb-8 text-pink-600">Cute Crane Catcher</div>
                        <div className="text-xl mb-4">This certificate is awarded to</div>
                        <div className="text-4xl border-b-2 border-dashed border-gray-600 px-8 pb-2 mb-8">A SUPER PLAYER</div>
                        <div className="text-2xl mb-4">For achieving a high score of</div>
                        <div className="text-7xl font-bold text-yellow-500" style={{textShadow: '3px 3px 0px #C55C89'}}>{score}</div>
                    </div>
                )}
                
                <div className="text-lg flex items-center justify-between w-full">
                    <span>Date: {new Date().toLocaleDateString()}</span>
                    <span>💖⭐✨🎀🍭</span>
                </div>
            </div>
        </div>
    );
};


// Main Modal Component
interface GameOverModalProps {
  score: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ score, onRestart }) => {
  const [view, setView] = useState<'nameInput' | 'summary' | 'photobooth' | 'certificate'>('nameInput');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadCertificate = useCallback(async () => {
    if (certificateRef.current) {
      try {
        const canvas = await (window as any).html2canvas(certificateRef.current, { scale: 2 });
        const link = document.createElement('a');
        link.download = `cute-crane-catcher-certificate-${score}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Failed to download certificate:', error);
      }
    }
  }, [score]);
  
  const handlePhotoTaken = (dataUrl: string) => {
      setPhotoDataUrl(dataUrl);
      setView('certificate');
  }

  const submitScore = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/.netlify/functions/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim(), score }),
      });

      if (!response.ok) throw new Error('Failed to submit score');

      setView('summary');
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score. You can still play again!');
      setView('summary');
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    switch(view) {
        case 'nameInput':
            return (
                <>
                    <h2 className="text-5xl text-pink-600 text-shadow-cute mb-4">GAME OVER</h2>
                    <p className="text-2xl text-yellow-800 mb-2">Final Score</p>
                    <p className="text-7xl font-bold text-green-500 mb-6" style={{textShadow: '3px 3px 0px #fff'}}>{score}</p>
                    <p className="text-lg text-pink-800 mb-4">Enter your name for the global leaderboard!</p>
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Your name..."
                        maxLength={20}
                        className="px-4 py-3 text-lg border-2 border-pink-400 rounded-md mb-4 w-full max-w-xs text-center"
                        onKeyPress={(e) => e.key === 'Enter' && submitScore()}
                    />
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={submitScore}
                            disabled={submitting}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md text-lg pixel-shadow disabled:bg-gray-400"
                        >
                            {submitting ? 'SUBMITTING...' : 'SUBMIT SCORE'}
                        </button>
                        <button
                            onClick={() => setView('summary')}
                            className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-md text-lg pixel-shadow"
                        >
                            SKIP
                        </button>
                    </div>
                </>
            );
        case 'photobooth':
            return <PhotoBooth onPhotoTaken={handlePhotoTaken} onBack={() => setView('summary')} />;
        case 'certificate':
            return (
                <div className="flex flex-col items-center">
                    <h3 className="text-3xl text-pink-500 mb-4">Your Certificate!</h3>
                    {photoDataUrl && <img src={photoDataUrl} alt="Your snapshot" className="w-48 h-48 rounded-lg border-4 border-pink-300 object-cover mb-4" />}
                    <p className="text-pink-800 mb-4">Looking good! Download your certificate now.</p>
                     <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={downloadCertificate} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-6 py-3 rounded-md text-lg pixel-shadow">
                           DOWNLOAD
                        </button>
                        <button onClick={() => setView('photobooth')} className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-md text-lg pixel-shadow">
                           RETAKE PHOTO
                        </button>
                         <button onClick={() => { setView('summary'); setPhotoDataUrl(null); }} className="bg-pink-300 hover:bg-pink-400 text-pink-800 px-6 py-3 rounded-md text-lg pixel-shadow">
                           CANCEL
                        </button>
                    </div>
                </div>
            );
        case 'summary':
        default:
            return (
                <>
                    <h2 className="text-5xl text-pink-600 text-shadow-cute mb-4">GAME OVER</h2>
                    <p className="text-2xl text-yellow-800 mb-2">Final Score</p>
                    <p className="text-7xl font-bold text-green-500 mb-8" style={{textShadow: '3px 3px 0px #fff'}}>{score}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={onRestart} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md text-lg pixel-shadow">
                        PLAY AGAIN
                    </button>
                    <button onClick={() => { setPhotoDataUrl(null); downloadCertificate(); }} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-6 py-3 rounded-md text-lg pixel-shadow">
                        GET CERTIFICATE
                    </button>
                    <button onClick={() => setView('photobooth')} className="bg-pink-400 hover:bg-pink-500 text-white px-6 py-3 rounded-md text-lg pixel-shadow">
                        ADD YOUR PHOTO
                    </button>
                    </div>
                </>
            );
    }
  }


  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-pink-200 to-yellow-200 border-4 border-white rounded-lg p-8 w-full max-w-2xl text-center shadow-2xl pixel-shadow">
        {renderContent()}
      </div>
      <Certificate score={score} photoDataUrl={photoDataUrl} certificateRef={certificateRef} />
    </div>
  );
};