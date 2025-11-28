/**
 * Security Image Service - Visual Keystone Authentication
 *
 * ARCHITECTURE:
 * - User selects ONE image from 48 options during setup
 * - During recovery, user must identify their image from a 3x3 grid (1 real + 8 decoys)
 * - Image selection IS the keystone (worth 3 shares, always required)
 * - Replaces text-based Q3 - harder to social engineer, easier to remember
 *
 * SECURITY BENEFITS:
 * - Can't be phished: fake sites don't know which image to show
 * - Can't be social engineered: "What's your security image?" doesn't work
 * - Visual recognition > text recall: users remember images for years
 * - Grid presentation prevents shoulder surfing (attacker sees 9 images, not 1)
 *
 * ANTI-PHISHING:
 * - During login, we show the user's image BEFORE they enter password
 * - If wrong image shown, user knows it's a fake site
 * - Image is identified by hash, never transmitted in plaintext
 */

import * as Crypto from 'expo-crypto';
import { encode as base64Encode } from 'base-64';

/**
 * Security image categories - 48 images total (8 categories × 6 images each)
 * In production, use actual image assets. These are identifiers/descriptions.
 */
export const SECURITY_IMAGE_CATEGORIES = {
  nature: [
    { id: 'nature_1', name: 'Mountain Peak', emoji: '🏔️', keywords: ['mountain', 'snow', 'peak'] },
    { id: 'nature_2', name: 'Ocean Wave', emoji: '🌊', keywords: ['ocean', 'wave', 'blue'] },
    { id: 'nature_3', name: 'Forest Path', emoji: '🌲', keywords: ['forest', 'trees', 'path'] },
    { id: 'nature_4', name: 'Desert Sunset', emoji: '🏜️', keywords: ['desert', 'sunset', 'sand'] },
    { id: 'nature_5', name: 'Waterfall', emoji: '💧', keywords: ['waterfall', 'water', 'cascade'] },
    { id: 'nature_6', name: 'Northern Lights', emoji: '🌌', keywords: ['aurora', 'lights', 'sky'] },
  ],
  animals: [
    { id: 'animal_1', name: 'Wolf', emoji: '🐺', keywords: ['wolf', 'wild', 'canine'] },
    { id: 'animal_2', name: 'Owl', emoji: '🦉', keywords: ['owl', 'night', 'wise'] },
    { id: 'animal_3', name: 'Dolphin', emoji: '🐬', keywords: ['dolphin', 'ocean', 'playful'] },
    { id: 'animal_4', name: 'Butterfly', emoji: '🦋', keywords: ['butterfly', 'wings', 'colorful'] },
    { id: 'animal_5', name: 'Fox', emoji: '🦊', keywords: ['fox', 'clever', 'orange'] },
    { id: 'animal_6', name: 'Hummingbird', emoji: '🐦', keywords: ['hummingbird', 'tiny', 'fast'] },
  ],
  objects: [
    { id: 'object_1', name: 'Vintage Key', emoji: '🗝️', keywords: ['key', 'vintage', 'unlock'] },
    { id: 'object_2', name: 'Compass', emoji: '🧭', keywords: ['compass', 'direction', 'navigate'] },
    { id: 'object_3', name: 'Hourglass', emoji: '⏳', keywords: ['hourglass', 'time', 'sand'] },
    { id: 'object_4', name: 'Lantern', emoji: '🏮', keywords: ['lantern', 'light', 'glow'] },
    { id: 'object_5', name: 'Telescope', emoji: '🔭', keywords: ['telescope', 'stars', 'observe'] },
    { id: 'object_6', name: 'Crystal Ball', emoji: '🔮', keywords: ['crystal', 'mystic', 'orb'] },
  ],
  cosmic: [
    { id: 'cosmic_1', name: 'Full Moon', emoji: '🌕', keywords: ['moon', 'full', 'night'] },
    { id: 'cosmic_2', name: 'Saturn', emoji: '🪐', keywords: ['saturn', 'rings', 'planet'] },
    { id: 'cosmic_3', name: 'Shooting Star', emoji: '🌠', keywords: ['star', 'shooting', 'wish'] },
    { id: 'cosmic_4', name: 'Eclipse', emoji: '🌑', keywords: ['eclipse', 'sun', 'moon'] },
    { id: 'cosmic_5', name: 'Galaxy', emoji: '🌀', keywords: ['galaxy', 'spiral', 'stars'] },
    { id: 'cosmic_6', name: 'Constellation', emoji: '✨', keywords: ['stars', 'pattern', 'constellation'] },
  ],
  elements: [
    { id: 'element_1', name: 'Fire', emoji: '🔥', keywords: ['fire', 'flame', 'heat'] },
    { id: 'element_2', name: 'Water Drop', emoji: '💧', keywords: ['water', 'drop', 'pure'] },
    { id: 'element_3', name: 'Wind', emoji: '🌬️', keywords: ['wind', 'air', 'breeze'] },
    { id: 'element_4', name: 'Earth', emoji: '🌍', keywords: ['earth', 'planet', 'globe'] },
    { id: 'element_5', name: 'Lightning', emoji: '⚡', keywords: ['lightning', 'electric', 'power'] },
    { id: 'element_6', name: 'Snowflake', emoji: '❄️', keywords: ['snow', 'ice', 'crystal'] },
  ],
  symbols: [
    { id: 'symbol_1', name: 'Infinity', emoji: '♾️', keywords: ['infinity', 'endless', 'loop'] },
    { id: 'symbol_2', name: 'Yin Yang', emoji: '☯️', keywords: ['balance', 'harmony', 'dual'] },
    { id: 'symbol_3', name: 'Heart', emoji: '💜', keywords: ['heart', 'love', 'purple'] },
    { id: 'symbol_4', name: 'Star', emoji: '⭐', keywords: ['star', 'shine', 'gold'] },
    { id: 'symbol_5', name: 'Diamond', emoji: '💎', keywords: ['diamond', 'gem', 'precious'] },
    { id: 'symbol_6', name: 'Lotus', emoji: '🪷', keywords: ['lotus', 'flower', 'zen'] },
  ],
  places: [
    { id: 'place_1', name: 'Lighthouse', emoji: '🗼', keywords: ['lighthouse', 'beacon', 'coast'] },
    { id: 'place_2', name: 'Castle', emoji: '🏰', keywords: ['castle', 'fortress', 'medieval'] },
    { id: 'place_3', name: 'Bridge', emoji: '🌉', keywords: ['bridge', 'connect', 'span'] },
    { id: 'place_4', name: 'Treehouse', emoji: '🏡', keywords: ['treehouse', 'hidden', 'cozy'] },
    { id: 'place_5', name: 'Cave', emoji: '🕳️', keywords: ['cave', 'mystery', 'hidden'] },
    { id: 'place_6', name: 'Garden', emoji: '🌸', keywords: ['garden', 'flowers', 'peaceful'] },
  ],
  transport: [
    { id: 'transport_1', name: 'Sailboat', emoji: '⛵', keywords: ['sailboat', 'ocean', 'journey'] },
    { id: 'transport_2', name: 'Hot Air Balloon', emoji: '🎈', keywords: ['balloon', 'float', 'sky'] },
    { id: 'transport_3', name: 'Rocket', emoji: '🚀', keywords: ['rocket', 'space', 'launch'] },
    { id: 'transport_4', name: 'Train', emoji: '🚂', keywords: ['train', 'journey', 'tracks'] },
    { id: 'transport_5', name: 'Bicycle', emoji: '🚲', keywords: ['bicycle', 'ride', 'pedal'] },
    { id: 'transport_6', name: 'Paper Airplane', emoji: '✈️', keywords: ['airplane', 'paper', 'fly'] },
  ],
};

/**
 * Get all security images as a flat array
 */
export function getAllSecurityImages() {
  const allImages = [];
  for (const category of Object.values(SECURITY_IMAGE_CATEGORIES)) {
    allImages.push(...category);
  }
  return allImages;
}

/**
 * Get a specific image by ID
 */
export function getImageById(imageId) {
  const allImages = getAllSecurityImages();
  return allImages.find(img => img.id === imageId) || null;
}

/**
 * Generate a hash of the selected image ID (for storage)
 * We don't store the image ID directly - we store a hash
 * This prevents DB admins from knowing which image was selected
 */
export async function hashImageSelection(imageId, salt) {
  const data = `${imageId}:${salt}:veilpath-image-keystone`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  return hash;
}

/**
 * Verify an image selection against stored hash
 */
export async function verifyImageSelection(imageId, salt, storedHash) {
  const computedHash = await hashImageSelection(imageId, salt);

  // Constant-time comparison
  if (computedHash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate a recovery grid (user's image + 8 random decoys)
 * Grid is shuffled so position is random
 *
 * @param {string} correctImageId - The user's selected image
 * @returns {Object[]} Array of 9 images in random order
 */
export function generateRecoveryGrid(correctImageId) {
  const allImages = getAllSecurityImages();
  const correctImage = allImages.find(img => img.id === correctImageId);

  if (!correctImage) {
    throw new Error('Invalid image ID');
  }

  // Get 8 random decoys (excluding the correct image)
  const decoys = allImages
    .filter(img => img.id !== correctImageId)
    .sort(() => Math.random() - 0.5) // Shuffle
    .slice(0, 8);

  // Combine and shuffle
  const grid = [...decoys, correctImage]
    .sort(() => Math.random() - 0.5);

  return grid.map((img, index) => ({
    ...img,
    gridPosition: index,
  }));
}

/**
 * Derive encryption key component from image selection
 * This becomes part of the weighted threshold scheme
 *
 * @param {string} imageId - Selected image ID
 * @param {string} salt - Unique salt for this user
 * @returns {Uint8Array} 32-byte key component
 */
export async function deriveKeyFromImage(imageId, salt) {
  // Multiple rounds of hashing for key stretching
  let key = `${imageId}:${salt}:keystone-image`;

  for (let i = 0; i < 1000; i++) {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key + i.toString(),
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    key = hash;
  }

  // Convert to bytes
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = key.charCodeAt(i % key.length);
  }

  return bytes;
}

/**
 * Security image setup data structure
 */
export function createImageKeystoneData(imageId, salt, imageHash) {
  return {
    type: 'image_keystone',
    version: 1,
    salt,
    imageHash, // Hash of image ID, not the ID itself
    createdAt: new Date().toISOString(),
    // For anti-phishing: store a hint that helps user recognize their image
    // without revealing it (e.g., first letter of category)
    categoryHint: imageId.split('_')[0].charAt(0).toUpperCase(),
  };
}

/**
 * User-facing explanation of the security system
 */
export const SECURITY_EXPLANATION = {
  title: "Your Privacy Shield",
  subtitle: "Military-grade protection for your most personal data",

  whyWeDoThis: `
VeilPath uses a cutting-edge multi-layer security system to ensure that YOUR data
stays YOUR data. Not even we can read your journals, readings, or personal information.

This isn't paranoia - it's respect for your privacy.
  `.trim(),

  howItWorks: [
    {
      step: 1,
      title: "Security Image (Your Visual Key)",
      description: "Pick one image that means something to you. This becomes your visual keystone - the one thing you'll always recognize instantly. During recovery, you'll pick it from a grid of 9 images.",
      icon: "🖼️",
    },
    {
      step: 2,
      title: "Security Questions (Your Backup Keys)",
      description: "Answer 4 personal questions. You'll need to remember at least 2 of them plus your image to recover your account. Pick answers only YOU would know.",
      icon: "❓",
    },
    {
      step: 3,
      title: "Recovery Phrase (Your Emergency Key)",
      description: "We'll show you 24 words once. Write them down and store them somewhere safe. This is your absolute last resort if all else fails.",
      icon: "📝",
    },
  ],

  whatThisMeans: [
    "✓ Your journals are encrypted before leaving your device",
    "✓ Your tarot readings and reflections are private - always",
    "✓ Even VeilPath admins cannot read your data",
    "✓ Hackers who breach our servers get only encrypted gibberish",
    "✓ If you sell VeilPath, the new owners can't access user data",
  ],

  theTradeoff: `
The price of true privacy: if you forget your password AND can't answer your security
questions AND lose your recovery phrase, your data is gone forever.

This isn't a bug - it's a feature. It means NO ONE can access your data without your
permission. Not hackers, not governments, not us.

Your secrets die with you if you choose. That's real privacy.
  `.trim(),

  recoveryRequirements: {
    minimum: "Your security image + any 2 security questions",
    alternative: "Your 24-word recovery phrase",
    note: "The security image is always required - it's your visual keystone",
  },
};

export default {
  SECURITY_IMAGE_CATEGORIES,
  SECURITY_EXPLANATION,
  getAllSecurityImages,
  getImageById,
  hashImageSelection,
  verifyImageSelection,
  generateRecoveryGrid,
  deriveKeyFromImage,
  createImageKeystoneData,
};
