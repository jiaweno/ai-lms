import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to conditionally join Tailwind CSS classes.
 * It uses `clsx` for conditional class joining and `tailwind-merge`
 * for intelligently merging Tailwind classes, resolving conflicts.
 *
 * @param inputs - Class values to be joined and merged.
 * @returns A single string containing the merged Tailwind CSS classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
