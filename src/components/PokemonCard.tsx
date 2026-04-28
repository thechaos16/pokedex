import React from 'react';
import type { Pokemon } from '../types/pokemon';
import './PokemonCard.css';

interface PokemonCardProps {
  pokemon: Pokemon;
  onClick: (pokemon: Pokemon) => void;
}

// Map korean types to CSS variables
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

export const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, onClick }) => {
  const primaryType = pokemon.types[0];
  const color = typeColorMap[primaryType] || 'var(--surface-color-light)';
  
  return (
    <div 
      className="pokemon-card glass-panel" 
      onClick={() => onClick(pokemon)}
      style={{ '--card-color': color } as React.CSSProperties}
    >
      <div className="pokemon-card-bg-gradient" />
      <div className="pokemon-card-header">
        <span className="pokemon-id">
          #{String(pokemon.id).padStart(3, '0')}
        </span>
      </div>
      
      <div className="pokemon-image-container">
        <img 
          src={pokemon.image} 
          alt={pokemon.name} 
          className="pokemon-image" 
          loading="lazy"
        />
      </div>
      
      <div className="pokemon-info">
        <h3 className="pokemon-name">
          {pokemon.name}
          {pokemon.subtitle && <div className="pokemon-subtitle" style={{fontSize: '0.8rem', opacity: 0.8, marginTop: '4px', fontWeight: 'normal'}}>{pokemon.subtitle}</div>}
        </h3>
        <div className="pokemon-types">
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
      </div>
    </div>
  );
};
