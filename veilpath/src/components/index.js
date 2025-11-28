/**
 * Component Index
 * Centralized export for all reusable components
 */

// Named exports
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { TarotCard } from './TarotCard';
export { MBTISelector } from './MBTISelector';
export { AudioPlayerButton, PlaylistCard } from './AudioPlayerButton';
export { VoiceToTextButton } from './VoiceToTextButton';

// Performance & UX components
export { ErrorBoundary } from './ErrorBoundary';
export { default as LoadingScreen } from './LoadingScreen';
export { default as Skeleton } from './SkeletonLoader';
export {
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonReadingCard,
  SkeletonJournalEntry,
  SkeletonListItem,
} from './SkeletonLoader';

// Import for default export
import { Button as ButtonComponent } from './Button';
import { Card as CardComponent } from './Card';
import { Input as InputComponent } from './Input';
import { TarotCard as TarotCardComponent } from './TarotCard';

export default {
  Button: ButtonComponent,
  Card: CardComponent,
  Input: InputComponent,
  TarotCard: TarotCardComponent,
};
