/**
 * ANIMATED ASCII TEXT COMPONENT
 * Character-by-character progressive reveal
 * Hearthstone-inspired dramatic unveiling effect
 */

import React, { useState, useEffect, useRef } from 'react';
import { Text } from 'react-native';

export default function AnimatedASCIIText({
  children,
  duration = 800,
  style,
  onComplete,
  enabled = true,
}) {
  const [visibleText, setVisibleText] = useState(enabled ? '' : children);
  const fullText = children || '';
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setVisibleText(fullText);
      onComplete && onComplete();
      return;
    }

    // Reset for new animation
    setVisibleText('');
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Calculate how many characters to show
      const targetLength = Math.floor(progress * fullText.length);

      // Reveal characters progressively
      const revealed = fullText.substring(0, targetLength);
      setVisibleText(revealed);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we show the full text
        setVisibleText(fullText);
        onComplete && onComplete();
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [fullText, duration, enabled]);

  return <Text style={style}>{visibleText}</Text>;
}
