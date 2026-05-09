import React, { useRef, useEffect, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import type { Pokemon } from '../types/pokemon';
import { LivePokemonClassifier } from '../services/classifier';
import './CameraTab.css';

interface CameraTabProps {
  pokemons: Pokemon[];
  onClassify: (pokemon: Pokemon) => void;
}

export const CameraTab: React.FC<CameraTabProps> = ({ pokemons, onClassify }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [progressInfo, setProgressInfo] = useState<string>('Initializing model...');
  
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

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || isScanning || isModelLoading) return;
    
    setIsScanning(true);
    try {
      // Pass the video element to the classifier model
      const result = await classifierRef.current!.classify(videoRef.current);
      console.log(`Classified as ${result.pokemon.name} with ${Math.round(result.confidence * 100)}% confidence`);
      onClassify(result.pokemon);
    } catch (err) {
      console.error("Classification failed:", err);
      setError("Classification failed: " + (err as Error).message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="camera-tab-container animate-fade-in">
      <div className="camera-view glass-panel">
        {error ? (
          <div className="camera-error">
            <p>{error}</p>
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
          </>
        )}
      </div>
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
    </div>
  );
};
