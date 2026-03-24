// wraply-shared/lib/agent/toolContract.js

/**
 * Tool Input
 * {
 *   jobId: string
 *   task: string
 *   context: object
 *   meta?: {
 *     attempt?: number
 *     timestamp?: number
 *   }
 * }
 *
 * Tool Output
 * {
 *   success: boolean
 *   data?: any
 *   error?: string
 *   logs?: string[]
 * }
 */