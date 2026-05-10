import React, { useState } from 'react';
import type { Pokemon } from '../types/pokemon';
import { PokemonCard } from './PokemonCard';
import { Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './PokemonGrid.css';

interface PokemonGridProps {
  pokemons: Pokemon[];
  capturedMap: Record<string, boolean>;
  onPokemonClick: (pokemon: Pokemon) => void;
}

export const PokemonGrid: React.FC<PokemonGridProps> = ({ pokemons, capturedMap, onPokemonClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'captured'>('all');
  const { user } = useAuth();

  const filteredPokemons = pokemons.filter(pokemon => {
    const matchesSearch = pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          String(pokemon.id).includes(searchTerm);
    const matchesFilter = filterMode === 'all' || (filterMode === 'captured' && capturedMap[pokemon.uuid]);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="pokemon-grid-container">
      <div className="search-bar-wrapper animate-fade-in" style={{ flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <div className="search-input-container glass-panel">
          <Search className="search-icon" size={24} />
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {user && (
          <div className="filter-pills glass-panel">
            <button 
              className={`filter-pill ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              All Pokémon
            </button>
            <button 
              className={`filter-pill ${filterMode === 'captured' ? 'active' : ''}`}
              onClick={() => setFilterMode('captured')}
            >
              Captured Only
            </button>
          </div>
        )}
      </div>
      
      {filteredPokemons.length === 0 ? (
        <div className="no-results">
          <p>No Pokémon found matching "{searchTerm}"</p>
        </div>
      ) : (
        <div className="pokemon-grid">
          {filteredPokemons.map((pokemon, index) => (
            <div 
              key={`${pokemon.id}-${pokemon.subtitle || 'base'}`} 
              className="animate-fade-in" 
              style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
            >
              <PokemonCard 
                pokemon={pokemon} 
                isCaptured={capturedMap[pokemon.uuid] || false}
                onClick={onPokemonClick} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
