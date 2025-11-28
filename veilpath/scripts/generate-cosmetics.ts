/**
 * PROCEDURAL COSMETIC GENERATION PIPELINE
 *
 * Uses AI to:
 * 1. Generate creative prompts for cosmetics
 * 2. Create images via Replicate/SDXL
 * 3. Queue for review
 * 4. Auto-release approved assets
 *
 * Run: npx ts-node scripts/generate-cosmetics.ts
 * Or via cron: api/cron/asset-pipeline.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import Replicate from 'replicate';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
  // Generation settings
  batchSize: 5,
  minBufferDays: 30,

  // Image settings
  cardBackSize: { width: 750, height: 1125 },
  otherSize: { width: 512, height: 512 },

  // Style guide
  styleKeywords: [
    'dark fantasy',
    'ethereal glow',
    'cosmic',
    'mystical',
    'deep purple and gold',
    'celestial',
    'tarot aesthetic',
    'intricate details',
    'magical atmosphere',
  ],

  // Theme pools for variety
  themes: {
    nature: ['forest', 'ocean', 'mountain', 'desert', 'garden', 'storm', 'aurora', 'moonlight'],
    cosmic: ['nebula', 'constellation', 'eclipse', 'meteor', 'galaxy', 'starfield', 'void', 'supernova'],
    mystical: ['crystal', 'runes', 'sigil', 'portal', 'flame', 'shadow', 'mirror', 'labyrinth'],
    elements: ['fire', 'water', 'earth', 'air', 'lightning', 'ice', 'metal', 'spirit'],
    creatures: ['phoenix', 'dragon', 'serpent', 'wolf', 'raven', 'owl', 'butterfly', 'moth'],
    symbols: ['eye', 'moon phases', 'sun', 'ankh', 'pentacle', 'tree of life', 'ouroboros', 'lotus'],
  },

  // Rarity distribution for generation
  rarityWeights: {
    common: 40,
    uncommon: 30,
    rare: 20,
    epic: 8,
    legendary: 2,
  },
};

interface CosmeticSpec {
  type: 'card_back' | 'border' | 'effect' | 'avatar' | 'title';
  theme: string;
  themeCategory: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  eventId?: string;
}

interface GeneratedAsset {
  id: string;
  name: string;
  prompt: string;
  imagePath: string;
  spec: CosmeticSpec;
}

export class CosmeticGenerator {
  private claude: Anthropic;
  private replicate: Replicate;
  private supabase: SupabaseClient;

  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Generate a creative name for the cosmetic
   */
  async generateName(spec: CosmeticSpec): Promise<string> {
    const response = await this.claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Generate a mystical, evocative name for a ${spec.rarity} ${spec.type} cosmetic with a ${spec.theme} theme.

Requirements:
- 2-3 words maximum
- Sounds magical/mysterious
- Avoids generic fantasy clichés
- Works as a collectible item name

Output ONLY the name, nothing else.`,
      }],
    });

    return (response.content[0] as { text: string }).text.trim();
  }

  /**
   * Generate AI prompt for image generation
   */
  async generatePrompt(spec: CosmeticSpec, name: string): Promise<string> {
    const typeDescriptions: Record<string, string> = {
      card_back: '750x1125px tarot card back design, centered composition, decorative border',
      border: 'ornate frame border with transparent center, PNG with alpha channel',
      effect: 'magical particle effect, ethereal energy, can be animated',
      avatar: 'circular portrait frame, mystical character or symbol',
      title: 'decorative text banner or badge design',
    };

    const rarityDescriptions: Record<string, string> = {
      common: 'clean, simple design with subtle details',
      uncommon: 'more intricate patterns, slight glow effects',
      rare: 'complex layered design, multiple magical elements',
      epic: 'highly detailed, dynamic energy, premium feel',
      legendary: 'extraordinary detail, multiple animated elements, museum quality',
    };

    const response = await this.claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Generate a Midjourney/SDXL prompt for a VeilPath tarot app cosmetic asset.

Asset: "${name}"
Type: ${spec.type} (${typeDescriptions[spec.type]})
Theme: ${spec.theme} (category: ${spec.themeCategory})
Rarity: ${spec.rarity} (${rarityDescriptions[spec.rarity]})

Style requirements:
${CONFIG.styleKeywords.map(k => `- ${k}`).join('\n')}

Technical requirements:
- Clean edges suitable for mobile app
- Works on dark backgrounds
- No text or watermarks
- High contrast for small screen visibility

Output ONLY the prompt, optimized for SDXL. No explanations.`,
      }],
    });

    return (response.content[0] as { text: string }).text.trim();
  }

  /**
   * Generate image using Replicate SDXL
   */
  async generateImage(prompt: string, spec: CosmeticSpec): Promise<string> {
    const size = spec.type === 'card_back' ? CONFIG.cardBackSize : CONFIG.otherSize;

    const output = await this.replicate.run(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      {
        input: {
          prompt: prompt,
          negative_prompt: 'blurry, low quality, text, watermark, signature, ugly, distorted, amateur, cropped, out of frame',
          width: size.width,
          height: size.height,
          num_outputs: 1,
          scheduler: 'K_EULER',
          num_inference_steps: 50,
          guidance_scale: 7.5,
          refine: 'expert_ensemble_refiner',
          high_noise_frac: 0.8,
        },
      }
    );

    // output is array of URLs
    return (output as string[])[0];
  }

  /**
   * Generate a random cosmetic specification
   */
  generateRandomSpec(): CosmeticSpec {
    // Pick random type
    const types: CosmeticSpec['type'][] = ['card_back', 'border', 'effect', 'avatar'];
    const type = types[Math.floor(Math.random() * types.length)];

    // Pick random theme category and theme
    const categories = Object.keys(CONFIG.themes);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const themes = CONFIG.themes[category as keyof typeof CONFIG.themes];
    const theme = themes[Math.floor(Math.random() * themes.length)];

    // Pick rarity using weighted random
    const rarity = this.weightedRandom(CONFIG.rarityWeights) as CosmeticSpec['rarity'];

    return { type, theme, themeCategory: category, rarity };
  }

  /**
   * Weighted random selection
   */
  private weightedRandom(weights: Record<string, number>): string {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let random = Math.random() * total;

    for (const [key, weight] of entries) {
      random -= weight;
      if (random <= 0) return key;
    }

    return entries[0][0];
  }

  /**
   * Queue a cosmetic for generation
   */
  async queueCosmetic(spec: CosmeticSpec): Promise<string> {
    const name = await this.generateName(spec);
    const prompt = await this.generatePrompt(spec, name);

    // Calculate release date (spread across next 30 days)
    const daysFromNow = Math.floor(Math.random() * 30) + 1;
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + daysFromNow);

    const { data, error } = await this.supabase
      .from('asset_queue')
      .insert({
        asset_type: spec.type,
        name: name,
        prompt: prompt,
        status: 'pending',
        scheduled_release: releaseDate.toISOString().split('T')[0],
        rarity: spec.rarity,
        event_id: spec.eventId,
        metadata: spec,
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[Generator] Queued: ${name} (${spec.rarity} ${spec.type}) for ${releaseDate.toISOString().split('T')[0]}`);

    return data.id;
  }

  /**
   * Process pending assets in the queue
   */
  async processPendingAssets(): Promise<number> {
    const { data: pending, error } = await this.supabase
      .from('asset_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(CONFIG.batchSize);

    if (error || !pending) {
      console.error('[Generator] Failed to fetch pending assets:', error);
      return 0;
    }

    let processed = 0;

    for (const asset of pending) {
      try {
        // Update status to generating
        await this.supabase
          .from('asset_queue')
          .update({ status: 'generating' })
          .eq('id', asset.id);

        console.log(`[Generator] Generating: ${asset.name}`);

        // Generate image
        const imageUrl = await this.generateImage(asset.prompt, asset.metadata as CosmeticSpec);

        // For now, store the URL directly
        // In production: download and upload to Supabase Storage
        const storagePath = imageUrl;

        // Update with result
        await this.supabase
          .from('asset_queue')
          .update({
            status: 'review',
            generated_path: storagePath,
            generation_provider: 'replicate-sdxl',
            generation_metadata: {
              generated_at: new Date().toISOString(),
              model: 'stability-ai/sdxl',
            },
          })
          .eq('id', asset.id);

        console.log(`[Generator] Completed: ${asset.name} -> ${storagePath}`);
        processed++;

      } catch (error) {
        console.error(`[Generator] Failed: ${asset.name}`, error);

        // Revert to pending with error info
        await this.supabase
          .from('asset_queue')
          .update({
            status: 'pending',
            metadata: {
              ...asset.metadata,
              last_error: error instanceof Error ? error.message : 'Unknown error',
              retry_count: ((asset.metadata as any)?.retry_count || 0) + 1,
            },
          })
          .eq('id', asset.id);
      }

      // Rate limiting - wait between generations
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return processed;
  }

  /**
   * Ensure minimum asset buffer
   */
  async ensureBuffer(): Promise<number> {
    // Count approved assets scheduled for future
    const { count } = await this.supabase
      .from('asset_queue')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'generating', 'review', 'approved'])
      .gte('scheduled_release', new Date().toISOString().split('T')[0]);

    const currentBuffer = count || 0;
    const needed = CONFIG.minBufferDays - currentBuffer;

    if (needed <= 0) {
      console.log(`[Generator] Buffer OK: ${currentBuffer} assets scheduled`);
      return 0;
    }

    console.log(`[Generator] Buffer low (${currentBuffer}), generating ${needed} more`);

    for (let i = 0; i < needed; i++) {
      const spec = this.generateRandomSpec();
      await this.queueCosmetic(spec);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return needed;
  }

  /**
   * Generate event-specific cosmetics
   */
  async generateEventCosmetics(eventId: string, count: number = 3): Promise<string[]> {
    // Get event details
    const { data: event } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const ids: string[] = [];

    for (let i = 0; i < count; i++) {
      const spec: CosmeticSpec = {
        type: ['card_back', 'border', 'effect'][i % 3] as CosmeticSpec['type'],
        theme: event.name.toLowerCase(),
        themeCategory: event.type,
        rarity: ['rare', 'epic', 'legendary'][i % 3] as CosmeticSpec['rarity'],
        eventId: eventId,
      };

      const id = await this.queueCosmetic(spec);
      ids.push(id);
    }

    console.log(`[Generator] Queued ${count} cosmetics for event: ${event.name}`);
    return ids;
  }

  /**
   * Get generation stats
   */
  async getStats(): Promise<Record<string, number>> {
    const statuses = ['pending', 'generating', 'review', 'approved', 'rejected', 'released'];
    const stats: Record<string, number> = {};

    for (const status of statuses) {
      const { count } = await this.supabase
        .from('asset_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      stats[status] = count || 0;
    }

    return stats;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  const generator = new CosmeticGenerator();

  switch (command) {
    case 'generate':
      const count = parseInt(args[1]) || 5;
      console.log(`Generating ${count} random cosmetics...`);
      for (let i = 0; i < count; i++) {
        const spec = generator.generateRandomSpec();
        await generator.queueCosmetic(spec);
      }
      break;

    case 'process':
      console.log('Processing pending assets...');
      const processed = await generator.processPendingAssets();
      console.log(`Processed ${processed} assets`);
      break;

    case 'buffer':
      console.log('Ensuring asset buffer...');
      const added = await generator.ensureBuffer();
      console.log(`Added ${added} assets to buffer`);
      break;

    case 'event':
      const eventId = args[1];
      if (!eventId) {
        console.error('Usage: generate-cosmetics event <event_id>');
        process.exit(1);
      }
      await generator.generateEventCosmetics(eventId);
      break;

    case 'status':
    default:
      const stats = await generator.getStats();
      console.log('Asset Queue Status:');
      console.table(stats);
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default CosmeticGenerator;
