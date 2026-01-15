/**
 * Utilitaire pour combiner les classes CSS Tailwind
 * Résout les conflits entre classes (ex: px-2 et px-4)
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
