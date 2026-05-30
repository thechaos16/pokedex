import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Pokemon } from '../types/pokemon';

export interface CapturedPokemon {
  id: string;
  user_id: string;
  pokemon_id: string;
  captured: boolean;
  captured_time: string;
  location: { lat: number; lng: number } | null;
  sex: string;
  size: string;
  weight: string;
  image_url?: string;
}

export const useCapturedPokemon = () => {
  const { user } = useAuth();
  const [capturedMap, setCapturedMap] = useState<Record<string, CapturedPokemon>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchCaptured = useCallback(async () => {
    if (!user) {
      setCapturedMap({});
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('captured_pokemon')
        .select('*')
        .eq('user_id', user.id)
        .eq('captured', true);

      if (error) throw error;

      const newMap: Record<string, CapturedPokemon> = {};
      if (data) {
        data.forEach((row: CapturedPokemon) => {
          newMap[row.pokemon_id] = row;
        });
      }
      setCapturedMap(newMap);
    } catch (err) {
      console.error('Error fetching captured pokemon:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCaptured();
  }, [fetchCaptured]);

  const toggleCapture = async (pokemon: Pokemon) => {
    if (!user) return;

    const pokemonUuid = pokemon.uuid;
    const isCurrentlyCaptured = !!capturedMap[pokemonUuid];
    const newCapturedState = !isCurrentlyCaptured;

    // Generate stats dynamically for the capture event
    let sex = '♂ Male';
    let size = pokemon.height;
    let weight = pokemon.weight;

    if (newCapturedState) {
      // Parse base height and weight to introduce ±15% random variation
      const heightNum = parseFloat(pokemon.height.replace(/[^0-9.]/g, '')) || 1.0;
      const weightNum = parseFloat(pokemon.weight.replace(/[^0-9.]/g, '')) || 10.0;
      
      const heightVar = heightNum * (0.85 + Math.random() * 0.3);
      const weightVar = weightNum * (0.85 + Math.random() * 0.3);
      
      size = `${heightVar.toFixed(2)}m`;
      weight = `${weightVar.toFixed(1)}kg`;
      sex = Math.random() > 0.5 ? '♂ Male' : '♀ Female';

      // Optimistic update: Add details to capturedMap
      setCapturedMap(prev => ({
        ...prev,
        [pokemonUuid]: {
          id: 'temp-id',
          user_id: user.id,
          pokemon_id: pokemonUuid,
          captured: true,
          captured_time: new Date().toISOString(),
          location: null,
          sex,
          size,
          weight
        }
      }));
    } else {
      // Optimistic update: Remove from capturedMap
      setCapturedMap(prev => {
        const next = { ...prev };
        delete next[pokemonUuid];
        return next;
      });
    }

    try {
      let location = null;
      
      if (newCapturedState) {
        // Get geolocation if permitted
        if ('geolocation' in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                maximumAge: 0
              });
            });
            location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
          } catch (locErr) {
            console.warn("Could not get geolocation", locErr);
          }
        }

        // Insert new capture with location and generated stats
        const { error } = await supabase
          .from('captured_pokemon')
          .insert([
            {
              user_id: user.id,
              pokemon_id: pokemonUuid,
              captured: true,
              location: location,
              sex,
              size,
              weight
            }
          ]);
        if (error) throw error;
        
        // Fetch from DB to ensure exact timestamps/ids are loaded
        fetchCaptured();
      } else {
        // Remove capture record
        const { error } = await supabase
          .from('captured_pokemon')
          .delete()
          .eq('user_id', user.id)
          .eq('pokemon_id', pokemonUuid);
        if (error) throw error;
      }

    } catch (err) {
      console.error('Error toggling capture:', err);
      // Revert to stable fetched state on error
      fetchCaptured();
    }
  };

  const capturePokemon = async (pokemon: Pokemon) => {
    if (!user) return;

    const pokemonUuid = pokemon.uuid;

    // Generate stats dynamically for the capture event
    const heightNum = parseFloat(pokemon.height.replace(/[^0-9.]/g, '')) || 1.0;
    const weightNum = parseFloat(pokemon.weight.replace(/[^0-9.]/g, '')) || 10.0;
    
    const heightVar = heightNum * (0.85 + Math.random() * 0.3);
    const weightVar = weightNum * (0.85 + Math.random() * 0.3);
    
    const size = `${heightVar.toFixed(2)}m`;
    const weight = `${weightVar.toFixed(1)}kg`;
    const sex = Math.random() > 0.5 ? '♂ Male' : '♀ Female';

    // Optimistic update: Add/overwrite details in capturedMap
    setCapturedMap(prev => ({
      ...prev,
      [pokemonUuid]: {
        id: 'temp-id',
        user_id: user.id,
        pokemon_id: pokemonUuid,
        captured: true,
        captured_time: new Date().toISOString(),
        location: null,
        sex,
        size,
        weight
      }
    }));

    try {
      let location = null;
      
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              maximumAge: 0
            });
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (locErr) {
          console.warn("Could not get geolocation", locErr);
        }
      }

      // Check if it already exists, if so delete it first to overwrite it
      const { error: deleteError } = await supabase
        .from('captured_pokemon')
        .delete()
        .eq('user_id', user.id)
        .eq('pokemon_id', pokemonUuid);

      if (deleteError) throw deleteError;

      // Insert new capture with location and generated stats
      const { error } = await supabase
        .from('captured_pokemon')
        .insert([
          {
            user_id: user.id,
            pokemon_id: pokemonUuid,
            captured: true,
            location: location,
            sex,
            size,
            weight
          }
        ]);
      if (error) throw error;
      
      // Fetch from DB to ensure exact database records are loaded
      fetchCaptured();
    } catch (err) {
      console.error('Error capturing pokemon:', err);
      // Revert to stable fetched state on error
      fetchCaptured();
      throw err;
    }
  };

  return {
    capturedMap,
    isLoading,
    toggleCapture,
    capturePokemon,
    refresh: fetchCaptured
  };
};
