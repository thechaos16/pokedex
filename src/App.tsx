import { useState } from 'react';
import pokemonData from './data/pokemon.json';
import type { Pokemon } from './types/pokemon';
import { PokemonGrid } from './components/PokemonGrid';
import { PokemonDetail } from './components/PokemonDetail';
import { CameraTab } from './components/CameraTab';
import { Database, LayoutGrid, Camera } from 'lucide-react';

function App() {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [activeTab, setActiveTab] = useState<'grid' | 'camera'>('grid');
  const [autoPlayMode, setAutoPlayMode] = useState(false);

  // Parse the data correctly
  const pokemons: Pokemon[] = (pokemonData as any[]).map(p => ({
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    image: p.image,
    types: p.types,
    description: p.description,
    height: p.height,
    weight: p.weight,
    category: p.category
  }));

  return (
    <>
      <header className="glass-header app-header">
        <div className="container">
          <h1 className="app-title">
            <Database size={32} color="#3b82f6" />
            Pokédex
          </h1>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
              onClick={() => setActiveTab('grid')}
            >
              <LayoutGrid size={20} />
              <span>Grid</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`}
              onClick={() => setActiveTab('camera')}
            >
              <Camera size={20} />
              <span>Camera</span>
            </button>
          </div>

          {activeTab === 'grid' ? (
            <PokemonGrid 
              pokemons={pokemons} 
              onPokemonClick={(pokemon) => {
                setAutoPlayMode(false);
                setSelectedPokemon(pokemon);
              }} 
            />
          ) : (
            <CameraTab 
              pokemons={pokemons} 
              onClassify={(pokemon) => {
                setAutoPlayMode(true);
                setSelectedPokemon(pokemon);
              }} 
            />
          )}
        </div>
      </main>

      {selectedPokemon && (
        <PokemonDetail 
          pokemon={selectedPokemon} 
          onClose={() => setSelectedPokemon(null)} 
          autoPlayTts={autoPlayMode}
        />
      )}
    </>
  );
}

export default App;
