import { summer2026 } from '@/lib/tournaments/2026-summer'
import type { Tournament } from '@/lib/schemas'

/**
 * The active tournament — single source of truth for the rest of the
 * app. To switch tournaments, change this import. Players don't browse
 * past seasons in-app (per the user); the executive team keeps that
 * record separately.
 */
export const TOURNAMENT: Tournament = summer2026
