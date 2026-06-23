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
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [progressInfo, setProgressInfo] = useState<string>('Initializing model...');
  
  // Local states for the identified Pokemon results
  const [detectedPokemon, setDetectedPokemon] = useState<Pokemon | null>(null);
  const [detectedConfidence, setDetectedConfidence] = useState<number | null>(null);
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'capturing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // ROI States
  const [roiState, setRoiState] = useState<'camera' | 'roi' | 'result'>('camera');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [roi, setRoi] = useState<{ x: number; y: number; w: number; h: number }>({ x: 25, y: 25, w: 50, h: 50 });
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    roiX: number;
    roiY: number;
    roiW: number;
    roiH: number;
    handle: 'move' | 'nw' | 'ne' | 'se' | 'sw';
  } | null>(null);

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

    // Only start camera if we are in camera state
    if (roiState === 'camera') {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [roiState]);

  // Handle window/document pointer movement for dragging the ROI box
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragStartRef.current || !containerRef.current) return;

      const drag = dragStartRef.current;
      const rect = containerRef.current.getBoundingClientRect();
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - drag.clientX;
      const dy = clientY - drag.clientY;

      // Convert layout pixels to percentage of the ROI container
      const pdx = (dx / rect.width) * 100;
      const pdy = (dy / rect.height) * 100;

      setRoi((prevRoi) => {
        let newX = prevRoi.x;
        let newY = prevRoi.y;
        let newW = prevRoi.w;
        let newH = prevRoi.h;

        const minSize = 10; // minimum percentage size for ROI box

        if (drag.handle === 'move') {
          // Move the entire box
          newX = Math.max(0, Math.min(100 - drag.roiW, drag.roiX + pdx));
          newY = Math.max(0, Math.min(100 - drag.roiH, drag.roiY + pdy));
        } else {
          // Resize using handle corners
          if (drag.handle === 'nw') {
            newX = Math.max(0, Math.min(drag.roiX + drag.roiW - minSize, drag.roiX + pdx));
            newY = Math.max(0, Math.min(drag.roiY + drag.roiH - minSize, drag.roiY + pdy));
            newW = drag.roiW - (newX - drag.roiX);
            newH = drag.roiH - (newY - drag.roiY);
          } else if (drag.handle === 'ne') {
            newY = Math.max(0, Math.min(drag.roiY + drag.roiH - minSize, drag.roiY + pdy));
            newW = Math.max(minSize, Math.min(100 - drag.roiX, drag.roiW + pdx));
            newH = drag.roiH - (newY - drag.roiY);
          } else if (drag.handle === 'se') {
            newW = Math.max(minSize, Math.min(100 - drag.roiX, drag.roiW + pdx));
            newH = Math.max(minSize, Math.min(100 - drag.roiY, drag.roiH + pdy));
          } else if (drag.handle === 'sw') {
            newX = Math.max(0, Math.min(drag.roiX + drag.roiW - minSize, drag.roiX + pdx));
            newW = drag.roiW - (newX - drag.roiX);
            newH = Math.max(minSize, Math.min(100 - drag.roiY, drag.roiH + pdy));
          }
        }

        return {
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          w: Math.round(newW * 10) / 10,
          h: Math.round(newH * 10) / 10
        };
      });
    };

    const handleEnd = () => {
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, handle: 'move' | 'nw' | 'ne' | 'se' | 'sw') => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      clientX,
      clientY,
      roiX: roi.x,
      roiY: roi.y,
      roiW: roi.w,
      roiH: roi.h,
      handle
    };
  };

  const handleCapture = () => {
    if (!videoRef.current || isScanning || isModelLoading) return;

    setError('');
    try {
      const video = videoRef.current;
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;

      // Crop the raw frame to match the 3:4 aspect ratio of the UI
      const targetAspectRatio = 3 / 4;
      const videoAspectRatio = videoWidth / videoHeight;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = videoWidth;
      let sourceHeight = videoHeight;

      if (videoAspectRatio > targetAspectRatio) {
        // Video is wider, crop the sides
        sourceWidth = videoHeight * targetAspectRatio;
        sourceX = (videoWidth - sourceWidth) / 2;
      } else if (videoAspectRatio < targetAspectRatio) {
        // Video is taller, crop the top/bottom
        sourceHeight = videoWidth / targetAspectRatio;
        sourceY = (videoHeight - sourceHeight) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          video,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, sourceWidth, sourceHeight
        );

        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(dataUrl);
        // Default box: 50% in the middle
        setRoi({ x: 25, y: 25, w: 50, h: 50 });
        setRoiState('roi');
      } else {
        throw new Error("Could not initialize canvas context for capturing.");
      }
    } catch (err) {
      console.error("Capture failed:", err);
      setError("Capture failed: " + (err as Error).message);
    }
  };

  const handleAnalyzeRegion = async () => {
    if (!capturedPhoto || isScanning || isModelLoading) return;

    setIsScanning(true);
    setError('');
    try {
      const img = new Image();
      img.src = capturedPhoto;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const cropX = (roi.x / 100) * img.width;
      const cropY = (roi.y / 100) * img.height;
      const cropW = (roi.w / 100) * img.width;
      const cropH = (roi.h / 100) * img.height;

      canvas.width = cropW;
      canvas.height = cropH;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        const result = await classifierRef.current!.classify(canvas);
        console.log(`Classified ROI as ${result.pokemon.name} with ${Math.round(result.confidence * 100)}% confidence`);

        setDetectedPokemon(result.pokemon);
        setDetectedConfidence(result.confidence);
        setCaptureStatus('idle');
        setStatusMessage('');
        setRoiState('result');
      } else {
        throw new Error("Could not initialize canvas context for cropping.");
      }
    } catch (err) {
      console.error("Classification failed:", err);
      setError("Classification failed: " + (err as Error).message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleBackToCamera = () => {
    setCapturedPhoto(null);
    setRoiState('camera');
    setError('');
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
    setCapturedPhoto(null);
    setCaptureStatus('idle');
    setStatusMessage('');
    setError('');
    setRoiState('camera');
  };

  const isAlreadyCaptured = detectedPokemon ? !!capturedMap[detectedPokemon.uuid] : false;
  const capturedDetails = detectedPokemon ? capturedMap[detectedPokemon.uuid] : null;

  return (
    <div className="camera-tab-container animate-fade-in">
      <div className="camera-view glass-panel">
        {error ? (
          <div className="camera-error">
            <p>{error}</p>
            {(detectedPokemon || roiState === 'roi') && (
              <button className="btn btn-secondary mt-4" onClick={handleScanAgain}>
                <RotateCcw size={16} /> Reset Camera
              </button>
            )}
          </div>
        ) : (
          <>
            {roiState === 'camera' && (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="camera-video"
              />
            )}

            {roiState === 'roi' && capturedPhoto && (
              <div className="roi-container" ref={containerRef}>
                <img src={capturedPhoto} alt="Captured preview" className="roi-image" />
                <div 
                  className="roi-box"
                  style={{
                    left: `${roi.x}%`,
                    top: `${roi.y}%`,
                    width: `${roi.w}%`,
                    height: `${roi.h}%`
                  }}
                  onMouseDown={(e) => handleDragStart(e, 'move')}
                  onTouchStart={(e) => handleDragStart(e, 'move')}
                >
                  <div className="roi-box-outline" />
                  <div className="roi-handle nw" onMouseDown={(e) => handleDragStart(e, 'nw')} onTouchStart={(e) => handleDragStart(e, 'nw')} />
                  <div className="roi-handle ne" onMouseDown={(e) => handleDragStart(e, 'ne')} onTouchStart={(e) => handleDragStart(e, 'ne')} />
                  <div className="roi-handle se" onMouseDown={(e) => handleDragStart(e, 'se')} onTouchStart={(e) => handleDragStart(e, 'se')} />
                  <div className="roi-handle sw" onMouseDown={(e) => handleDragStart(e, 'sw')} onTouchStart={(e) => handleDragStart(e, 'sw')} />
                </div>
              </div>
            )}

            {roiState === 'result' && capturedPhoto && (
              <div className="roi-container result-preview">
                <img src={capturedPhoto} alt="Captured preview" className="roi-image" />
                <div 
                  className="roi-box static"
                  style={{
                    left: `${roi.x}%`,
                    top: `${roi.y}%`,
                    width: `${roi.w}%`,
                    height: `${roi.h}%`
                  }}
                />
              </div>
            )}

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

      {roiState === 'camera' && (
        <div className="camera-controls">
          <button 
            className="capture-btn" 
            onClick={handleCapture}
            disabled={!!error || isScanning || isModelLoading}
            aria-label="Take picture and crop"
          >
            <Camera size={32} />
          </button>
        </div>
      )}

      {roiState === 'roi' && (
        <div className="roi-controls animate-fade-in">
          <button 
            className="action-btn scan-again-btn"
            onClick={handleBackToCamera}
            disabled={isScanning}
          >
            <RotateCcw size={18} />
            <span>Re-take</span>
          </button>

          <button 
            className="action-btn capture-poke-btn"
            onClick={handleAnalyzeRegion}
            disabled={isScanning}
          >
            <Sparkles size={18} />
            <span>Analyze Region</span>
          </button>
        </div>
      )}

      {roiState === 'result' && detectedPokemon && (
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
