import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface CapturedPokemon {
  id: string;
  user_id: string;
  pokemon_id: number;
  captured: boolean;
  captured_time: string;
  location: any;
}

export const useCapturedPokemon = () => {
  const { user } = useAuth();
  const [capturedMap, setCapturedMap] = useState<Record<number, boolean>>({});
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

      const newMap: Record<number, boolean> = {};
      if (data) {
        data.forEach((row: CapturedPokemon) => {
          newMap[row.pokemon_id] = true;
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

  const toggleCapture = async (pokemonId: number) => {
    if (!user) return;

    const isCurrentlyCaptured = capturedMap[pokemonId] || false;
    const newCapturedState = !isCurrentlyCaptured;

    // Optimistic update
    setCapturedMap(prev => ({
      ...prev,
      [pokemonId]: newCapturedState
    }));

    try {
      let location = null;
      
      // Get location only when capturing (not uncapturing)
      if (newCapturedState && 'geolocation' in navigator) {
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
          // Proceed without location if denied or timeout
        }
      }

      if (!isCurrentlyCaptured) {
        // Insert new capture
        const { error } = await supabase
          .from('captured_pokemon')
          .insert([
            {
              user_id: user.id,
              pokemon_id: pokemonId,
              captured: true,
              location: location
            }
          ]);
        if (error) throw error;
      } else {
        // Remove or update capture to false
        const { error } = await supabase
          .from('captured_pokemon')
          .delete()
          .eq('user_id', user.id)
          .eq('pokemon_id', pokemonId);
        if (error) throw error;
      }

    } catch (err) {
      console.error('Error toggling capture:', err);
      // Revert on error
      setCapturedMap(prev => ({
        ...prev,
        [pokemonId]: isCurrentlyCaptured
      }));
    }
  };

  return {
    capturedMap,
    isLoading,
    toggleCapture,
    refresh: fetchCaptured
  };
};
