import { useState } from 'react';
import pokemonData from './data/pokemon.json';
import type { Pokemon } from './types/pokemon';
import { PokemonGrid } from './components/PokemonGrid';
import { PokemonDetail } from './components/PokemonDetail';
import { CameraTab } from './components/CameraTab';
import { Database, LayoutGrid, Camera, LogIn, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useCapturedPokemon } from './hooks/useCapturedPokemon';

function App() {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [activeTab, setActiveTab] = useState<'grid' | 'camera'>('grid');
  const [autoPlayMode, setAutoPlayMode] = useState(false);
  const { user, signInWithGoogle, signOut } = useAuth();
  const { capturedMap, toggleCapture } = useCapturedPokemon();

  const pokemons: Pokemon[] = (pokemonData as any[]).map(p => ({
    id: p.id,
    uuid: p.uuid,
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
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="app-title">
            <Database size={32} color="#3b82f6" />
            Pokédex
          </h1>
          <div className="auth-section">
            {user ? (
              <button onClick={signOut} className="tab-btn" style={{ background: 'var(--surface-color-light)' }}>
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            ) : (
              <button onClick={signInWithGoogle} className="tab-btn" style={{ background: 'var(--surface-color-light)', color: 'var(--type-water)' }}>
                <LogIn size={20} />
                <span>Login</span>
              </button>
            )}
          </div>
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
              capturedMap={capturedMap}
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
          isCaptured={capturedMap[selectedPokemon.uuid] || false}
          onToggleCapture={() => toggleCapture(selectedPokemon.uuid)}
          onClose={() => setSelectedPokemon(null)} 
          autoPlayTts={autoPlayMode}
          isLoggedIn={!!user}
        />
      )}
    </>
  );
}

export default App;
