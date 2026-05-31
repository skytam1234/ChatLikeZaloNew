import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 * @param {...any} inputs - Class values to merge
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
