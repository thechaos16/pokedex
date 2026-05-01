import type { Pokemon } from '../types/pokemon';

/**
 * The structure for the future classification model's result.
 * It contains the identified Pokémon and optionally a confidence score.
 */
export interface ClassifierResult {
  pokemon: Pokemon;
  confidence: number;
}

/**
 * Interface that any future classification model (e.g., TensorFlow.js, or an API client) must implement.
 */
export interface PokemonClassifier {
  /**
   * Initializes the model (loads weights, warms up GPU, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Runs inference on the provided image element, canvas, or video stream.
   * @param imageElement The source image to classify
   * @returns A promise that resolves to the classification result
   */
  classify(imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<ClassifierResult>;
}

/**
 * A mock classifier that currently picks a random Pokémon from the list.
 * Swap this out with your real model implementation later!
 */
export class MockPokemonClassifier implements PokemonClassifier {
  private pokemons: Pokemon[];

  constructor(pokemons: Pokemon[]) {
    this.pokemons = pokemons;
  }

  async initialize(): Promise<void> {
    // Simulate model loading time
    return new Promise(resolve => setTimeout(resolve, 500));
  }

  async classify(_imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<ClassifierResult> {
    // Simulate inference delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Pick a random Pokémon to simulate the model's prediction
    const randomIndex = Math.floor(Math.random() * this.pokemons.length);
    const predictedPokemon = this.pokemons[randomIndex];

    return {
      pokemon: predictedPokemon,
      // Random confidence score between 0.6 and 0.99
      confidence: 0.6 + Math.random() * 0.39 
    };
  }
}
