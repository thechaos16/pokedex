import React, { useState, useEffect } from 'react';
import type { Pokemon } from '../types/pokemon';
import type { CapturedPokemon } from '../hooks/useCapturedPokemon';
import { X, ArrowLeft, Ruler, Weight, Volume2, Square, CheckSquare, Square as SquareOutline, Calendar, MapPin, Camera } from 'lucide-react';
import './PokemonDetail.css';

interface PokemonDetailProps {
  pokemon: Pokemon;
  isCaptured: boolean;
  capturedDetails?: CapturedPokemon | null;
  onToggleCapture: () => void;
  onClose: () => void;
  autoPlayTts?: boolean;
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

export const PokemonDetail: React.FC<PokemonDetailProps> = ({ 
  pokemon, 
  isCaptured, 
  capturedDetails,
  onToggleCapture, 
  onClose, 
  autoPlayTts = false, 
  isLoggedIn 
}) => {
  const primaryType = pokemon.types[0];
  const color = typeColorMap[primaryType] || 'var(--surface-color-light)';
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'capture'>('info');

  useEffect(() => {
    // Cleanup speech synthesis when component unmounts
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    // Reset tab to overview if uncaptured
    if (!isCaptured) {
      setActiveTab('info');
    }
  }, [isCaptured]);

  const playSpeech = () => {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(pokemon.description);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const toggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      playSpeech();
    }
  };

  useEffect(() => {
    if (autoPlayTts) {
      // Use a slight delay to allow modal transition
      const timer = setTimeout(() => {
        playSpeech();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPlayTts, pokemon.id]);

  return (
    <div className="pokemon-detail-overlay">
      <div 
        className="pokemon-detail-modal glass-panel animate-fade-in"
        style={{ '--modal-color': color } as React.CSSProperties}
      >
        <div className="modal-bg-gradient" />
        
        <button className="close-btn" onClick={onClose}>
          <X size={28} />
        </button>

        <div className="modal-header">
          <button className="back-btn" onClick={onClose}>
            <ArrowLeft size={24} /> Back
          </button>
          <span className="modal-id">#{String(pokemon.id).padStart(3, '0')}</span>
        </div>

        <div className="modal-content-split">
          <div className="modal-image-section">
            <img src={pokemon.image} alt={pokemon.name} className="modal-image" />
          </div>

          <div className="modal-info-section">
            <h2 className="modal-name">
              {pokemon.name}
            </h2>
            {pokemon.subtitle && <div className="modal-subtitle" style={{fontSize: '1.4rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600}}>{pokemon.subtitle}</div>}
            <div className="modal-category">{pokemon.category}</div>

            {isLoggedIn && (
              <div 
                className="capture-toggle glass-panel" 
                onClick={onToggleCapture} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  marginTop: '12px', 
                  marginBottom: '16px',
                  padding: '10px 16px', 
                  borderRadius: '12px', 
                  width: 'fit-content',
                  transition: 'all 0.2s ease',
                  backgroundColor: isCaptured ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface-color)',
                  border: isCaptured ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-color)',
                  zIndex: 5
                }}
              >
                {isCaptured ? <CheckSquare size={22} color="#3b82f6" /> : <SquareOutline size={22} color="var(--text-secondary)" />}
                <span style={{ 
                  fontWeight: 600, 
                  color: isCaptured ? '#3b82f6' : 'var(--text-primary)',
                  fontSize: '1.1rem'
                }}>
                  {isCaptured ? 'Captured' : 'Mark as Captured'}
                </span>
              </div>
            )}

            {isLoggedIn && isCaptured && (
              <div className="detail-tabs">
                <button 
                  className={`detail-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                  onClick={() => setActiveTab('info')}
                >
                  Overview
                </button>
                <button 
                  className={`detail-tab-btn ${activeTab === 'capture' ? 'active' : ''}`}
                  onClick={() => setActiveTab('capture')}
                >
                  Captured Details
                </button>
              </div>
            )}
            
            {activeTab === 'info' ? (
              <>
                <div className="pokemon-types modal-types">
                  {pokemon.types.map(type => (
                    <span 
                      key={type} 
                      className="type-badge"
                      style={{ backgroundColor: typeColorMap[type] || 'var(--surface-color)' }}
                    >
                      {type}
                    </span>
                  ))}
                </div>

                <div className="modal-description glass-panel" style={{ position: 'relative' }}>
                  <button 
                    onClick={toggleSpeech}
                    className="speech-btn"
                    title="Read Description"
                  >
                    {isPlaying ? <Square size={18} /> : <Volume2 size={18} />}
                  </button>
                  <p>{pokemon.description}</p>
                </div>

                <div className="modal-stats">
                  <div className="stat-box glass-panel">
                    <Ruler className="stat-icon" />
                    <div className="stat-value">{pokemon.height}</div>
                    <div className="stat-label">Height</div>
                  </div>
                  <div className="stat-box glass-panel">
                    <Weight className="stat-icon" />
                    <div className="stat-value">{pokemon.weight}</div>
                    <div className="stat-label">Weight</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="captured-details-panel animate-fade-in">
                {capturedDetails ? (
                  <div className="captured-grid">
                    {/* Gender/Sex */}
                    <div className="captured-stat-box glass-panel">
                      <div className="captured-stat-icon-wrapper gender">
                        <span style={{ fontSize: '1.2rem' }}>
                          {capturedDetails.sex?.includes('Female') || capturedDetails.sex?.includes('♀') ? '♀' : '♂'}
                        </span>
                      </div>
                      <div className="captured-stat-content">
                        <div className="captured-stat-label">Gender</div>
                        <div className="captured-stat-value">{capturedDetails.sex}</div>
                      </div>
                    </div>

                    {/* Size */}
                    <div className="captured-stat-box glass-panel">
                      <div className="captured-stat-icon-wrapper size">
                        <Ruler size={20} />
                      </div>
                      <div className="captured-stat-content">
                        <div className="captured-stat-label">Captured Height</div>
                        <div className="captured-stat-value">{capturedDetails.size}</div>
                      </div>
                    </div>

                    {/* Weight */}
                    <div className="captured-stat-box glass-panel">
                      <div className="captured-stat-icon-wrapper weight">
                        <Weight size={20} />
                      </div>
                      <div className="captured-stat-content">
                        <div className="captured-stat-label">Captured Weight</div>
                        <div className="captured-stat-value">{capturedDetails.weight}</div>
                      </div>
                    </div>

                    {/* Captured Time */}
                    <div className="captured-stat-box glass-panel full-width">
                      <div className="captured-stat-icon-wrapper time">
                        <Calendar size={20} />
                      </div>
                      <div className="captured-stat-content">
                        <div className="captured-stat-label">Captured Time</div>
                        <div className="captured-stat-value" style={{ fontSize: '1rem', fontWeight: 600 }}>
                          {new Date(capturedDetails.captured_time).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="captured-stat-box glass-panel full-width">
                      <div className="captured-stat-icon-wrapper location">
                        <MapPin size={20} />
                      </div>
                      <div className="captured-stat-content">
                        <div className="captured-stat-label">Capture Location</div>
                        <div className="captured-stat-value" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                          {capturedDetails.location && capturedDetails.location.lat && capturedDetails.location.lng ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span>Lat: {capturedDetails.location.lat.toFixed(6)}, Lng: {capturedDetails.location.lng.toFixed(6)}</span>
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${capturedDetails.location.lat},${capturedDetails.location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-link"
                              >
                                Open in Google Maps
                              </a>
                            </div>
                          ) : (
                            'No location recorded'
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Image placeholder */}
                    <div className="captured-stat-box glass-panel full-width image-placeholder-box">
                      <div className="captured-stat-icon-wrapper image-future">
                        <Camera size={20} />
                      </div>
                      <div className="captured-stat-content">
                        <div className="captured-stat-label">Camera Image (Future Feature)</div>
                        <div className="captured-stat-value" style={{ fontSize: '0.9rem', fontStyle: 'italic', fontWeight: 500, color: 'var(--text-secondary)' }}>
                          Photos captured in real-time will appear here in the future.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-details-msg">No captured details found. Try re-capturing this Pokémon.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
