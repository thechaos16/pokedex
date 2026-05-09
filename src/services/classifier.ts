import type { Pokemon } from '../types/pokemon';
import { VisionEmbeddingClassifier } from './visionClassifier';
import { embeddingDb } from './db';
import precomputedEmbeddings from '../data/pokemon_embeddings.json';

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

/**
 * A classifier that uses the actual vision embedding model to compare live camera 
 * feed against pre-computed embeddings stored in a local IndexedDB.
 */
export class LivePokemonClassifier implements PokemonClassifier {
  private pokemons: Pokemon[];
  private visionClassifier: VisionEmbeddingClassifier;

  constructor(pokemons: Pokemon[]) {
    this.pokemons = pokemons;
    this.visionClassifier = new VisionEmbeddingClassifier();
  }

  async initialize(onProgress?: (info: any) => void): Promise<void> {
    // 1. Initialize the AI model (download weights if not cached)
    await this.visionClassifier.initialize(onProgress);
    
    // 2. Initialize the local database
    await embeddingDb.init();

    // 3. Populate IndexedDB if it's empty
    const count = await embeddingDb.getCount();
    if (count === 0) {
      console.log('Populating IndexedDB with pre-computed embeddings...');
      const recordsToSave = precomputedEmbeddings.map((item: any) => ({
        id: `base-${item.pokemonId}-${item.name}`,
        pokemonId: item.pokemonId,
        name: item.name,
        embedding: item.embedding,
        timestamp: Date.now()
      }));
      await embeddingDb.saveEmbeddingsBulk(recordsToSave);
      console.log('Populated IndexedDB successfully.');
    }
  }

  async classify(imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<ClassifierResult> {
    const allRecords = await embeddingDb.getAllEmbeddings();
    
    // Map to the format expected by findClosestMatch
    const recordsForMatch = allRecords.map(r => ({
      id: r.id,
      embedding: r.embedding,
      metadata: { pokemonId: r.pokemonId }
    }));

    let imageSrc: string | HTMLImageElement | HTMLCanvasElement = imageElement;
    
    // transformers.js does not natively support HTMLVideoElement, so draw it to a canvas first
    if (imageElement instanceof HTMLVideoElement) {
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.videoWidth || 640;
      canvas.height = imageElement.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
        imageSrc = canvas.toDataURL('image/jpeg');
      }
    }

    const match = await this.visionClassifier.findClosestMatch(imageSrc, recordsForMatch);

    if (!match) {
      throw new Error("No embeddings found in the database to compare against.");
    }

    const matchedPokemonId = match.record.metadata?.pokemonId;
    
    // Find the pokemon object in the list
    const predictedPokemon = this.pokemons.find(p => p.id === matchedPokemonId) || this.pokemons[0];

    return {
      pokemon: predictedPokemon,
      // the cosine similarity might be around 0.6~0.9 for matches.
      // We'll map it directly to confidence.
      confidence: match.similarity, 
    };
  }
}
