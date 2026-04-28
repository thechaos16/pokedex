import React from 'react';
import type { Pokemon } from '../types/pokemon';
import { X, ArrowLeft, Ruler, Weight } from 'lucide-react';
import './PokemonDetail.css';

interface PokemonDetailProps {
  pokemon: Pokemon;
  onClose: () => void;
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

export const PokemonDetail: React.FC<PokemonDetailProps> = ({ pokemon, onClose }) => {
  const primaryType = pokemon.types[0];
  const color = typeColorMap[primaryType] || 'var(--surface-color-light)';

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

            <div className="modal-description glass-panel">
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
          </div>
        </div>
      </div>
    </div>
  );
};
