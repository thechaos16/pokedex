import React, { useRef, useEffect, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import type { Pokemon } from '../types/pokemon';
import { MockPokemonClassifier } from '../services/classifier';
import './CameraTab.css';

interface CameraTabProps {
  pokemons: Pokemon[];
  onClassify: (pokemon: Pokemon) => void;
}

export const CameraTab: React.FC<CameraTabProps> = ({ pokemons, onClassify }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  
  // Initialize the classifier singleton
  const classifierRef = useRef(new MockPokemonClassifier(pokemons));

  useEffect(() => {
    // Optional: Pre-warm the model
    classifierRef.current.initialize();
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
    if (!videoRef.current || isScanning) return;
    
    setIsScanning(true);
    try {
      // Pass the video element to the classifier model
      const result = await classifierRef.current.classify(videoRef.current);
      console.log(`Classified as ${result.pokemon.name} with ${Math.round(result.confidence * 100)}% confidence`);
      onClassify(result.pokemon);
    } catch (err) {
      console.error("Classification failed:", err);
      setError("Classification failed");
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
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="camera-video"
          />
        )}
      </div>
      <div className="camera-controls">
        <button 
          className="capture-btn" 
          onClick={handleCapture}
          disabled={!!error || isScanning}
          aria-label="Take picture and classify"
        >
          {isScanning ? <Loader2 size={32} className="animate-spin" /> : <Camera size={32} />}
        </button>
      </div>
    </div>
  );
};
