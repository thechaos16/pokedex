import { pipeline, env } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Disable local models since we are fetching from huggingface
env.allowLocalModels = false;

async function generateEmbeddings() {
  console.log("Loading Pokemon data...");
  const pokemonDataPath = path.resolve(__dirname, '../src/data/pokemon.json');
  const pokemonData = JSON.parse(fs.readFileSync(pokemonDataPath, 'utf8'));

  // Get all base Pokemon (we want unique base IDs where subtitle is empty)
  // Let's filter to where subtitle is empty (base form)
  const basePokemons = pokemonData.filter(p => p.subtitle === '');
  console.log(`Found ${basePokemons.length} base Pokemon.`);

  console.log("Initializing model...");
  const extractor = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32');

  const embeddings = [];

  console.log("Generating embeddings...");
  for (let i = 0; i < basePokemons.length; i++) {
    const pokemon = basePokemons[i];
    console.log(`Processing ${i + 1}/${basePokemons.length}: ${pokemon.name}`);
    
    try {
      // transformers.js supports passing URLs directly for image pipelines in Node.js
      const output = await extractor(pokemon.image);
      const embeddingArray = Array.from(output.data);
      
      embeddings.push({
        pokemonId: pokemon.id,
        name: pokemon.name,
        embedding: embeddingArray
      });
    } catch (err) {
      console.error(`Failed to process ${pokemon.name}:`, err.message);
    }
  }

  const outputPath = path.resolve(__dirname, '../src/data/pokemon_embeddings.json');
  fs.writeFileSync(outputPath, JSON.stringify(embeddings, null, 2));
  console.log(`Saved ${embeddings.length} embeddings to ${outputPath}`);
}

generateEmbeddings().catch(console.error);
