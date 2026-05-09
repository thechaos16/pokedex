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

  // Get first 151 Pokemon (we want unique base IDs up to 151, wait, pokemon.json has duplicates for megas/alolans)
  // Let's filter to where id <= 151 and subtitle is empty (base form)
  const first151 = pokemonData.filter(p => p.id <= 151 && p.subtitle === '');
  console.log(`Found ${first151.length} base Pokemon from Gen 1.`);

  console.log("Initializing model...");
  const extractor = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32');

  const embeddings = [];

  console.log("Generating embeddings...");
  for (let i = 0; i < first151.length; i++) {
    const pokemon = first151[i];
    console.log(`Processing ${i + 1}/${first151.length}: ${pokemon.name}`);
    
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
