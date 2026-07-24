/**
 * CoinGecko — prezzi crypto, nessuna API key richiesta.
 * CoinGecko identifica gli asset con un `id` (es. "bitcoin"), non con il
 * ticker ("BTC"): usiamo una mappa dei ticker più comuni con fallback su /search.
 */

const BASE_URL = 'https://api.coingecko.com/api/v3'

/** Mappa ticker → id CoinGecko per le crypto più diffuse. */
export const TICKER_TO_ID = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  SOL: 'solana',
  USDC: 'usd-coin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  TRX: 'tron',
  TON: 'the-open-network',
  AVAX: 'avalanche-2',
  SHIB: 'shiba-inu',
  DOT: 'polkadot',
  LINK: 'chainlink',
  BCH: 'bitcoin-cash',
  MATIC: 'matic-network',
  POL: 'polygon-ecosystem-token',
  LTC: 'litecoin',
  NEAR: 'near',
  UNI: 'uniswap',
  ICP: 'internet-computer',
  APT: 'aptos',
  XLM: 'stellar',
  ETC: 'ethereum-classic',
  ATOM: 'cosmos',
  XMR: 'monero',
  FIL: 'filecoin',
  HBAR: 'hedera-hashgraph',
  ARB: 'arbitrum',
  OP: 'optimism',
  VET: 'vechain',
  IMX: 'immutable-x',
  INJ: 'injective-protocol',
  SUI: 'sui',
  GRT: 'the-graph',
  AAVE: 'aave',
  ALGO: 'algorand',
  SAND: 'the-sandbox',
  MANA: 'decentraland',
  AXS: 'axie-infinity',
  EGLD: 'elrond-erd-2',
  THETA: 'theta-token',
  FTM: 'fantom',
  RUNE: 'thorchain',
  CRV: 'curve-dao-token',
  MKR: 'maker',
  SNX: 'havven',
  CAKE: 'pancakeswap-token',
  DAI: 'dai',
  PEPE: 'pepe',
  WIF: 'dogwifcoin',
  BONK: 'bonk',
  RNDR: 'render-token',
  TIA: 'celestia',
  SEI: 'sei-network',
  STX: 'blockstack',
  KAS: 'kaspa',
  QNT: 'quant-network',
  FLOW: 'flow',
  CHZ: 'chiliz',
  GALA: 'gala',
  LDO: 'lido-dao',
  ENA: 'ethena',
  JUP: 'jupiter-exchange-solana',
}

/** Cache in memoria degli id risolti via /search (evita ricerche ripetute). */
const resolvedIds = new Map()

async function getJSON(url) {
  let res
  try {
    res = await fetch(url, { headers: { accept: 'application/json' } })
  } catch {
    throw new Error('CoinGecko non raggiungibile (connessione assente?)')
  }
  if (!res.ok) {
    throw new Error(
      res.status === 429
        ? 'Troppe richieste a CoinGecko: riprova fra qualche minuto'
        : `CoinGecko ha risposto ${res.status}`,
    )
  }
  return res.json()
}

/**
 * Risolve un ticker crypto nell'id CoinGecko.
 * @returns {Promise<string|null>}
 */
export async function resolveCoinId(ticker) {
  const symbol = String(ticker || '').trim().toUpperCase()
  if (!symbol) return null
  if (TICKER_TO_ID[symbol]) return TICKER_TO_ID[symbol]
  if (resolvedIds.has(symbol)) return resolvedIds.get(symbol)

  const data = await getJSON(`${BASE_URL}/search?query=${encodeURIComponent(symbol)}`)
  const coins = Array.isArray(data?.coins) ? data.coins : []
  // /search restituisce i risultati ordinati per rilevanza: preferiamo il primo
  // con simbolo esattamente uguale, altrimenti il primo risultato assoluto.
  const exact = coins.find((c) => String(c.symbol || '').toUpperCase() === symbol)
  const id = (exact || coins[0])?.id || null
  if (id) resolvedIds.set(symbol, id)
  return id
}

/**
 * Prezzi in EUR e USD per una lista di ticker crypto (una sola chiamata /simple/price).
 * @param {string[]} tickers
 * @returns {Promise<{prices: Object<string,{prezzoUSD:number,prezzoEUR:number}>, errors: Object<string,string>}>}
 */
export async function fetchCryptoPrices(tickers) {
  const prices = {}
  const errors = {}
  const idByTicker = {}

  for (const ticker of tickers) {
    const symbol = ticker.toUpperCase()
    try {
      const id = await resolveCoinId(symbol)
      if (id) idByTicker[symbol] = id
      else errors[symbol] = 'Ticker crypto non riconosciuto da CoinGecko'
    } catch (err) {
      errors[symbol] = err.message || 'Errore di rete'
    }
  }

  const ids = [...new Set(Object.values(idByTicker))]
  if (ids.length === 0) return { prices, errors }

  try {
    const data = await getJSON(
      `${BASE_URL}/simple/price?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=eur,usd`,
    )
    for (const [symbol, id] of Object.entries(idByTicker)) {
      const quote = data?.[id]
      if (quote && Number.isFinite(quote.usd) && Number.isFinite(quote.eur)) {
        prices[symbol] = { prezzoUSD: quote.usd, prezzoEUR: quote.eur }
      } else {
        errors[symbol] = 'Prezzo non disponibile su CoinGecko'
      }
    }
  } catch (err) {
    for (const symbol of Object.keys(idByTicker)) {
      errors[symbol] = err.message || 'Errore di rete'
    }
  }

  return { prices, errors }
}
