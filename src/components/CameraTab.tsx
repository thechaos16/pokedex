import React, { useRef, useEffect, useState } from 'react';
import { Camera, Loader2, RotateCcw, Sparkles, Check, BookOpen, AlertCircle, Info, Lock } from 'lucide-react';
import type { Pokemon } from '../types/pokemon';
import { LivePokemonClassifier } from '../services/classifier';
import './CameraTab.css';

interface CameraTabProps {
  pokemons: Pokemon[];
  onClassify: (pokemon: Pokemon) => void;
  capturedMap: Record<string, any>;
  capturePokemon: (pokemon: Pokemon) => Promise<void>;
  isLoggedIn: boolean;
}

const typeColorMap: Record<string, string> = {
  '노말': 'var(--type-normal)',
  '불꽃': 'var(--type-fire)',
  '물': 'var(--type-water)',
  '전기': 'var(--type-electric)',
  '풀': 'var(--type-grass)',
  '얼음': 'var(--type-ice)',
  '격투': 'var(--type-fighting)',
  '독': 'var(--type-poison)',
  '땅': 'var(--type-ground)',
  '비행': 'var(--type-flying)',
  '에스퍼': 'var(--type-psychic)',
  '벌레': 'var(--type-bug)',
  '바위': 'var(--type-rock)',
  '고스트': 'var(--type-ghost)',
  '드래곤': 'var(--type-dragon)',
  '악': 'var(--type-dark)',
  '강철': 'var(--type-steel)',
  '페어리': 'var(--type-fairy)',
};

export const CameraTab: React.FC<CameraTabProps> = ({ 
  pokemons, 
  onClassify,
  capturedMap,
  capturePokemon,
  isLoggedIn
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [progressInfo, setProgressInfo] = useState<string>('Initializing model...');
  
  // Local states for the identified Pokemon results
  const [detectedPokemon, setDetectedPokemon] = useState<Pokemon | null>(null);
  const [detectedConfidence, setDetectedConfidence] = useState<number | null>(null);
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'capturing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Initialize the classifier singleton
  const classifierRef = useRef<LivePokemonClassifier | null>(null);

  if (!classifierRef.current) {
    classifierRef.current = new LivePokemonClassifier(pokemons);
  }

  useEffect(() => {
    let mounted = true;

    const initModel = async () => {
      try {
        await classifierRef.current?.initialize((info: any) => {
          if (info.status === 'progress') {
            setProgressInfo(`Downloading: ${Math.round(info.progress)}%`);
          } else if (info.status === 'ready') {
            setProgressInfo('Model ready');
          } else if (info.status === 'initiate') {
            setProgressInfo('Loading...');
          }
        });
        if (mounted) {
          setIsModelLoading(false);
        }
      } catch (err) {
        console.error("Failed to initialize model:", err);
        if (mounted) setError("Failed to load Vision Model.");
      }
    };
    
    initModel();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError('Camera access denied or not available.');
      }
    };

    // Only start camera if we aren't showing a snapshot
    if (!detectedPokemon) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [detectedPokemon]);

  const handleCapture = async () => {
    if (!videoRef.current || isScanning || isModelLoading) return;
    
    setIsScanning(true);
    setError('');
    try {
      // Pause video to act as a frozen photo snapshot
      videoRef.current.pause();

      // Pass the video element to the classifier model
      const result = await classifierRef.current!.classify(videoRef.current);
      console.log(`Classified as ${result.pokemon.name} with ${Math.round(result.confidence * 100)}% confidence`);
      
      setDetectedPokemon(result.pokemon);
      setDetectedConfidence(result.confidence);
      setCaptureStatus('idle');
      setStatusMessage('');
    } catch (err) {
      console.error("Classification failed:", err);
      setError("Classification failed: " + (err as Error).message);
      // Resume video feed if classification fails
      videoRef.current?.play().catch(() => {});
    } finally {
      setIsScanning(false);
    }
  };

  const handleCapturePokemon = async () => {
    if (!detectedPokemon || !isLoggedIn) return;
    
    setCaptureStatus('capturing');
    setStatusMessage('Capturing Pokémon...');
    try {
      await capturePokemon(detectedPokemon);
      setCaptureStatus('success');
      setStatusMessage(`${detectedPokemon.name} was successfully captured!`);
    } catch (err) {
      console.error("Failed to capture:", err);
      setCaptureStatus('error');
      setStatusMessage('Capture failed. Please try again.');
    }
  };

  const handleScanAgain = () => {
    setDetectedPokemon(null);
    setDetectedConfidence(null);
    setCaptureStatus('idle');
    setStatusMessage('');
    setError('');
    // The camera useEffect will automatically re-run and re-instantiate getUserMedia
  };

  const isAlreadyCaptured = detectedPokemon ? !!capturedMap[detectedPokemon.uuid] : false;
  const capturedDetails = detectedPokemon ? capturedMap[detectedPokemon.uuid] : null;

  return (
    <div className="camera-tab-container animate-fade-in">
      <div className="camera-view glass-panel">
        {error ? (
          <div className="camera-error">
            <p>{error}</p>
            {detectedPokemon && (
              <button className="btn btn-secondary mt-4" onClick={handleScanAgain}>
                <RotateCcw size={16} /> Reset Camera
              </button>
            )}
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="camera-video"
            />
            {isModelLoading && (
              <div className="camera-overlay loading-overlay">
                <Loader2 size={48} className="animate-spin text-white mb-4" />
                <p className="text-white font-medium">{progressInfo}</p>
              </div>
            )}
            {isScanning && (
              <div className="camera-overlay scanning-overlay">
                <Loader2 size={48} className="animate-spin text-white mb-4" />
                <p className="text-white font-medium">Analyzing Pokémon...</p>
              </div>
            )}
          </>
        )}
      </div>

      {!detectedPokemon ? (
        <div className="camera-controls">
          <button 
            className="capture-btn" 
            onClick={handleCapture}
            disabled={!!error || isScanning || isModelLoading}
            aria-label="Take picture and classify"
          >
            {isScanning ? <Loader2 size={32} className="animate-spin" /> : <Camera size={32} />}
          </button>
        </div>
      ) : (
        <div className="detected-pokemon-panel glass-panel animate-fade-in">
          <div className="detected-header">
            <Sparkles size={20} className="text-yellow-400" />
            <h3>Pokémon Detected!</h3>
            <Sparkles size={20} className="text-yellow-400" />
          </div>

          <div className="detected-content">
            <div className="detected-image-sec">
              <img src={detectedPokemon.image} alt={detectedPokemon.name} className="detected-img" />
              <div className="detected-types">
                {detectedPokemon.types.map(type => (
                  <span 
                    key={type} 
                    className="type-badge small"
                    style={{ backgroundColor: typeColorMap[type] || 'var(--surface-color)' }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="detected-info-sec">
              <h4 className="detected-name">{detectedPokemon.name}</h4>
              {detectedPokemon.subtitle && <span className="detected-subtitle">{detectedPokemon.subtitle}</span>}
              
              {detectedConfidence !== null && (
                <div className="confidence-container">
                  <div className="confidence-label">
                    <span>Match Probability:</span>
                    <span className="confidence-val">{Math.round(detectedConfidence * 100)}%</span>
                  </div>
                  <div className="confidence-bar-bg">
                    <div 
                      className="confidence-bar-fill" 
                      style={{ width: `${Math.round(detectedConfidence * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Message Display */}
          {captureStatus === 'success' && capturedDetails && (
            <div className="capture-status success-banner">
              <Check size={18} />
              <div className="status-details">
                <span className="bold-status">{statusMessage}</span>
                <span className="stats-info">
                  Gender: {capturedDetails.sex} | Size: {capturedDetails.size} | Weight: {capturedDetails.weight}
                </span>
              </div>
            </div>
          )}

          {captureStatus === 'error' && (
            <div className="capture-status error-banner">
              <AlertCircle size={18} />
              <span>{statusMessage}</span>
            </div>
          )}

          {captureStatus === 'idle' && isAlreadyCaptured && (
            <div className="capture-status warning-banner">
              <Info size={18} />
              <span>Already Captured. Re-capturing will overwrite stats!</span>
            </div>
          )}

          {captureStatus === 'idle' && !isLoggedIn && (
            <div className="capture-status lock-banner">
              <Lock size={18} />
              <span>Log in to capture this Pokémon.</span>
            </div>
          )}

          <div className="detected-actions">
            <button 
              className="action-btn scan-again-btn"
              onClick={handleScanAgain}
              disabled={captureStatus === 'capturing'}
            >
              <RotateCcw size={18} />
              <span>Scan Again</span>
            </button>

            <button 
              className="action-btn details-btn"
              onClick={() => onClassify(detectedPokemon)}
              disabled={captureStatus === 'capturing'}
            >
              <BookOpen size={18} />
              <span>Pokedex Info</span>
            </button>

            <button 
              className={`action-btn capture-poke-btn ${isAlreadyCaptured ? 'overwrite' : ''}`}
              onClick={handleCapturePokemon}
              disabled={!isLoggedIn || captureStatus === 'capturing' || captureStatus === 'success'}
            >
              {captureStatus === 'capturing' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : captureStatus === 'success' ? (
                <Check size={18} />
              ) : (
                <svg className="pokeball-icon" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 19.9,11H16.1C15.6,9.3 14,8 12,8C10,8 8.4,9.3 7.9,11H4.1A8,8 0 0,1 12,4M12,20A8,8 0 0,1 4.1,13H7.9C8.4,14.7 10,16 12,16C14,16 15.6,14.7 16.1,13H19.9A8,8 0 0,1 12,20M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z" />
                </svg>
              )}
              <span>
                {captureStatus === 'capturing' 
                  ? 'Capturing...' 
                  : captureStatus === 'success' 
                  ? 'Captured!' 
                  : isAlreadyCaptured 
                  ? 'Overwrite' 
                  : 'Capture'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
