/**
 * CUSTOM ENTRY POINT
 *
 * This file loads BEFORE the Expo entry point to ensure the Dimensions patch
 * is applied before React Navigation or any other module accesses dimensions.
 */

// CRITICAL: Patch Dimensions FIRST, before anything else
import './pre-init-dimensions';

// Now load the normal Expo entry point
import 'expo/AppEntry';
