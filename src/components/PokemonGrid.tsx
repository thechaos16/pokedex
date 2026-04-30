import React, { useState } from 'react';
import type { Pokemon } from '../types/pokemon';
import { PokemonCard } from './PokemonCard';
import { Search } from 'lucide-react';
import './PokemonGrid.css';

interface PokemonGridProps {
  pokemons: Pokemon[];
  onPokemonClick: (pokemon: Pokemon) => void;
}

export const PokemonGrid: React.FC<PokemonGridProps> = ({ pokemons, onPokemonClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPokemons = pokemons.filter(pokemon => 
    pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(pokemon.id).includes(searchTerm)
  );

  return (
    <div className="pokemon-grid-container">
      <div className="search-bar-wrapper animate-fade-in">
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
                onClick={onPokemonClick} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
