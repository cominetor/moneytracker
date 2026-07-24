/**
 * Coda + throttle per Alpha Vantage (piano gratuito: 5 richieste/minuto, 25/giorno).
 *
 * - le chiamate vengono serializzate e distanziate di almeno 12s (5/min)
 * - il contatore giornaliero è persistito su localStorage, così sopravvive
 *   ai reload della pagina
 */
import { loadAlphaVantageUsage, saveAlphaVantageUsage } from './storage.js'

export const MAX_PER_MINUTE = 5
export const MAX_PER_DAY = 25
const MIN_SPACING_MS = 60_000 / MAX_PER_MINUTE // 12s
const MINUTE_MS = 60_000

export class RateLimitError extends Error {
  constructor(message) {
    super(message)
    this.name = 'RateLimitError'
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function readUsage() {
  const usage = loadAlphaVantageUsage()
  if (!usage || usage.day !== today()) {
    return { day: today(), count: 0, recent: [] }
  }
  return {
    day: usage.day,
    count: Number(usage.count) || 0,
    recent: Array.isArray(usage.recent) ? usage.recent.filter((t) => typeof t === 'number') : [],
  }
}

function writeUsage(usage) {
  const cutoff = Date.now() - MINUTE_MS
  saveAlphaVantageUsage({
    day: usage.day,
    count: usage.count,
    recent: usage.recent.filter((t) => t > cutoff),
  })
}

function recordCall() {
  const usage = readUsage()
  usage.count += 1
  usage.recent.push(Date.now())
  writeUsage(usage)
}

/** Stato corrente del budget, usato dalla UI per abilitare/disabilitare il refresh. */
export function getRateLimitStatus() {
  const usage = readUsage()
  const cutoff = Date.now() - MINUTE_MS
  const inLastMinute = usage.recent.filter((t) => t > cutoff)
  const remainingToday = Math.max(0, MAX_PER_DAY - usage.count)
  const remainingThisMinute = Math.max(0, MAX_PER_MINUTE - inLastMinute.length)
  const nextSlotInMs =
    remainingThisMinute > 0 || inLastMinute.length === 0
      ? 0
      : Math.max(0, Math.min(...inLastMinute) + MINUTE_MS - Date.now())

  return {
    usedToday: usage.count,
    remainingToday,
    remainingThisMinute,
    nextSlotInMs,
    exhausted: remainingToday === 0,
    // "vicino al limite": budget giornaliero finito o meno di 2 chiamate residue nel minuto
    nearLimit: remainingToday === 0 || remainingThisMinute === 0,
    queued: queue.length + (running ? 1 : 0),
  }
}

/** Segna il budget giornaliero come esaurito (risposta di rate limit dell'API). */
export function markDailyLimitReached() {
  const usage = readUsage()
  usage.count = MAX_PER_DAY
  writeUsage(usage)
}

const queue = []
let running = false

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function drain() {
  if (running) return
  running = true
  try {
    while (queue.length > 0) {
      const task = queue.shift()
      const usage = readUsage()
      if (usage.count >= MAX_PER_DAY) {
        task.reject(
          new RateLimitError(
            `Limite giornaliero Alpha Vantage raggiunto (${MAX_PER_DAY} richieste).`,
          ),
        )
        continue
      }

      const { nextSlotInMs } = getRateLimitStatus()
      if (nextSlotInMs > 0) await sleep(nextSlotInMs)

      recordCall()
      try {
        task.resolve(await task.fn())
      } catch (err) {
        task.reject(err)
      }

      if (queue.length > 0) await sleep(MIN_SPACING_MS)
    }
  } finally {
    running = false
  }
}

/**
 * Accoda una chiamata rispettando i limiti del piano gratuito.
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export function scheduleAlphaVantageCall(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject })
    drain()
  })
}
