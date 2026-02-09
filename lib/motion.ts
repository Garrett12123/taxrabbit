/**
 * Unified Motion Design System
 * Consistent timing and easing for premium feel.
 */

/**
 * Duration tokens (in milliseconds)
 * Use these for consistent animation timing.
 */
export const duration = {
  /** Micro interactions - 100ms */
  instant: 100,
  /** Quick feedback - 150ms */
  fast: 150,
  /** Standard transitions - 200ms */
  normal: 200,
  /** Emphasis animations - 300ms */
  slow: 300,
  /** Page transitions - 400ms */
  slower: 400,
  /** Complex sequences - 500ms */
  slowest: 500,
} as const;

/**
 * Easing curves
 * Industry-standard curves for different purposes.
 */
export const easing = {
  /** Default - smooth deceleration */
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Entering elements - starts fast, slows down */
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
  /** Exiting elements - starts slow, speeds up */
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Symmetric - for toggles and reversible */
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Bouncy spring effect */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Snappy, responsive feel */
  snappy: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Linear - for infinite loops */
  linear: 'linear',
} as const;

/**
 * Transition presets for common use cases
 * Use with Tailwind arbitrary values or inline styles.
 */
export const transition = {
  /** Button hover/active states */
  button: `all ${duration.fast}ms ${easing.snappy}`,
  /** Card hover effects */
  card: `all ${duration.normal}ms ${easing.easeOut}`,
  /** Input focus */
  input: `all ${duration.fast}ms ${easing.easeOut}`,
  /** Modal/dialog enter */
  modal: `all ${duration.slow}ms ${easing.spring}`,
  /** Page transitions */
  page: `all ${duration.slower}ms ${easing.easeOut}`,
  /** Color/theme changes */
  color: `color ${duration.normal}ms ${easing.default}, background-color ${duration.normal}ms ${easing.default}`,
  /** Transform only (scale, translate) */
  transform: `transform ${duration.fast}ms ${easing.snappy}`,
  /** Opacity only */
  opacity: `opacity ${duration.fast}ms ${easing.easeOut}`,
} as const;

/**
 * Stagger delay calculator
 * Returns delay for nth item in a staggered animation.
 */
export function staggerDelay(index: number, baseDelay = 50): number {
  return index * baseDelay;
}

/**
 * Spring physics for complex animations
 */
export const springConfig = {
  /** Gentle bounce */
  gentle: { stiffness: 120, damping: 14 },
  /** Snappy response */
  snappy: { stiffness: 400, damping: 30 },
  /** Bouncy entrance */
  bouncy: { stiffness: 300, damping: 10 },
  /** Smooth deceleration */
  smooth: { stiffness: 200, damping: 20 },
} as const;
