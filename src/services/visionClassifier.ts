import { pipeline, env } from '@xenova/transformers';

// Configure environment for browser usage
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface ImageRecord {
  id: string;
  embedding: number[];
  metadata?: any;
}

export class VisionEmbeddingClassifier {
  private modelId = 'Xenova/clip-vit-base-patch32';
  private extractor: any = null;

  /**
   * Initializes the vision embedding model.
   * First time this is called, it will download the model weights (~300MB+).
   * Subsequent calls will load from browser cache.
   * 
   * @param onProgress Callback to report download progress
   */
  async initialize(onProgress?: (info: any) => void) {
    if (!this.extractor) {
      // Use 'image-feature-extraction' to ensure we process images for CLIP
      this.extractor = await pipeline('image-feature-extraction', this.modelId, {
        progress_callback: onProgress,
      });
    }
  }

  /**
   * Extracts the embedding vector for a given image.
   * 
   * @param imageSrc The image source (URL, HTMLImageElement, HTMLCanvasElement)
   * @returns A 1D array of numbers representing the embedding
   */
  async getEmbedding(imageSrc: string | HTMLImageElement | HTMLCanvasElement): Promise<number[]> {
    if (!this.extractor) {
      throw new Error("Classifier not initialized. Call initialize() first.");
    }

    // Process image through the pipeline
    const output = await this.extractor(imageSrc);
    
    // Output is a Tensor. For CLIP image features, the shape is usually [1, 512].
    // Convert the underlying typed array to a standard JavaScript array.
    return Array.from(output.data);
  }

  /**
   * Computes the cosine similarity between two vectors.
   * 
   * @param vecA First vector
   * @param vecB Second vector
   * @returns Similarity score between -1 and 1 (higher is more similar)
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error(`Vector length mismatch: ${vecA.length} vs ${vecB.length}`);
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Compares a target image against a list of known image records and returns the best match.
   * 
   * @param targetImage The image to compare
   * @param records List of previously stored ImageRecords (containing embeddings)
   * @returns The best matching record and its similarity score, or null if records is empty
   */
  async findClosestMatch(
    targetImage: string | HTMLImageElement | HTMLCanvasElement, 
    records: ImageRecord[]
  ): Promise<{ record: ImageRecord; similarity: number } | null> {
    if (records.length === 0) return null;

    const targetEmbedding = await this.getEmbedding(targetImage);
    
    let bestMatch: ImageRecord | null = null;
    let bestSimilarity = -Infinity;

    for (const record of records) {
      const sim = this.cosineSimilarity(targetEmbedding, record.embedding);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatch = record;
      }
    }

    if (!bestMatch) return null;

    return {
      record: bestMatch,
      similarity: bestSimilarity
    };
  }
}
