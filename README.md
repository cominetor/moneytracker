# Portfolio Tracker

Webapp single-page per monitorare il valore corrente di un portafoglio personale di
**crypto e azioni**, con prezzi aggiornati automaticamente e storico del valore totale.
Nessun backend, nessun account: tutto vive nel `localStorage` del browser.

## Avvio

```bash
npm install
npm run dev
```

Build di produzione: `npm run build` (output in `dist/`), anteprima con `npm run preview`.

## Funzionalità

- **Dashboard**: valore totale in EUR (USD come riferimento), data/ora dell'ultimo
  aggiornamento prezzi, pie chart dell'allocazione, line chart dello storico, lista
  degli asset con prezzo unitario, valore della posizione e azioni modifica/elimina.
- **Aggiunta/modifica asset**: tipo (crypto/azione), ticker, nome facoltativo, quantità
  decimale; validazione su ticker non vuoto e quantità > 0; ricalcolo immediato.
- **Prezzi crypto** da [CoinGecko](https://www.coingecko.com/) (`/simple/price`, nessuna
  API key). Il ticker viene risolto nell'`id` CoinGecko tramite una mappa delle crypto più
  comuni, con fallback sull'endpoint `/search`.
- **Prezzi azioni** da Yahoo Finance (`/v8/finance/chart`, **senza API key**), nella valuta
  di quotazione del titolo e quindi convertiti in EUR/USD con il cambio di
  [Frankfurter](https://frankfurter.app/) (gratuito, senza key). Per le borse non americane
  serve il suffisso di mercato: `ENI.MI`, `VOD.L`, `AIR.PA`.
- **Ripiego facoltativo** su [Alpha Vantage](https://www.alphavantage.co/) (`GLOBAL_QUOTE`):
  usato solo se Yahoo non risponde e se una API key è stata configurata nelle impostazioni.
  Senza key l'app funziona comunque.
- **Cache e rate limit**: un prezzo più recente di 15 minuti non viene richiesto di nuovo;
  le chiamate ad Alpha Vantage passano da una coda che rispetta il piano gratuito
  (5 richieste/minuto, 25/giorno, contatore giornaliero persistito). In caso di errore o
  quota esaurita resta visibile l'ultimo prezzo noto con badge **"non aggiornato"**, e il
  pulsante di refresh manuale si disabilita finché la quota non torna disponibile.
- **Snapshot storico**: all'avvio, se non esiste ancora uno snapshot con la data odierna,
  ne viene creato uno con il valore totale corrente. Il line chart si costruisce da lì.
- **Impostazioni**: API key Alpha Vantage facoltativa (con link alla pagina per ottenerla
  gratis) e intervallo di refresh dei prezzi (default 15 minuti).
- **Backup**: esportazione in `.json` di `holdings`, `snapshots` e `settings`; importazione
  con conferma esplicita prima di sovrascrivere i dati correnti.
- **Offline**: i dati salvati e gli ultimi prezzi noti restano visibili senza connessione;
  serve rete solo per aggiornare le quotazioni.

## Struttura

```
src/
  App.jsx                  stato dei modali e composizione
  hooks/
    usePortfolio.js        stato applicativo: dati, prezzi, totali, azioni
    useChartTheme.js       token cromatici in base a light/dark mode
  services/                layer API + persistenza (nessuna dipendenza dalla UI)
    storage.js             unico accesso a localStorage
    priceCache.js          cache prezzi con TTL di 15 minuti
    coingecko.js           prezzi crypto + mappa ticker → id
    yahooFinance.js        prezzi azioni senza API key
    alphaVantage.js        prezzi azioni di ripiego (GLOBAL_QUOTE)
    rateLimiter.js         coda/throttle 5 al minuto, 25 al giorno
    fx.js                  cambi verso EUR/USD (Frankfurter)
    prices.js              orchestrazione cache/API per il refresh
    portfolio.js           posizioni, totali, allocazione
    snapshots.js           snapshot giornaliero
    backup.js              export/import JSON
  components/              Dashboard, Header, AssetList/AssetCard, AssetForm,
                           Settings, AllocationPieChart, HistoryLineChart, …
  utils/                   formattazione numeri/date, mappa colori delle serie
  theme/palette.js         palette dei grafici (light/dark)
```

## Dati in localStorage

| chiave | contenuto |
|---|---|
| `holdings` | `[{ id, tipo: "crypto" \| "stock", ticker, nome, quantita }]` |
| `snapshots` | `[{ data: "YYYY-MM-DD", valoreTotaleEUR, valoreTotaleUSD }]` |
| `settings` | `{ alphaVantageApiKey, refreshIntervalMinutes }` |
| `priceCache` | `{ [ticker]: { prezzoUSD, prezzoEUR, timestamp } }` |
| `fxCache` | ultimo cambio USD→EUR noto (cache tecnica) |
| `alphaVantageUsage` | consumo giornaliero della quota Alpha Vantage (cache tecnica) |

Solo le prime tre chiavi finiscono nel file di backup.

## Fuori scope

ETF e liquidità, storico delle transazioni, P&L e prezzo medio di carico, sync
multi-dispositivo e account.
