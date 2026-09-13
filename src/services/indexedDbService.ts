/**
 * MarketRadar Institutional IndexedDB Deep Cache Engine
 * Provides resilient, offline-first persistent storage for bot state,
 * streaming quotes, paper trades, trade signals, logs, and telemetry.
 */

export interface IndexedDbStorageStats {
  quotesCount: number;
  tradesCount: number;
  signalsCount: number;
  logsCount: number;
  settingsSaved: boolean;
  stateSaved: boolean;
  estimatedSizeKb: number;
  lastUpdated: number;
  dbName: string;
  version: number;
}

const DB_NAME = 'MarketRadar_Institutional_DB_v2';
const DB_VERSION = 2;

class MarketIndexedDbService {
  private db: IDBDatabase | null = null;
  private isSupported: boolean = typeof window !== 'undefined' && 'indexedDB' in window;
  private initPromise: Promise<IDBDatabase | null> | null = null;

  constructor() {
    if (this.isSupported) {
      this.initDatabase().catch(err => {
        console.warn('⚠️ [IndexedDB] Failed initial bootstrap, falling back to graceful cache:', err);
      });
    }
  }

  /**
   * Initialize and upgrade the IndexedDB schema
   */
  public async initDatabase(): Promise<IDBDatabase | null> {
    if (!this.isSupported) return null;
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // 1. App State & Key-Value Configuration Store
          if (!db.objectStoreNames.contains('app_state')) {
            db.createObjectStore('app_state', { keyPath: 'key' });
          }

          // 2. Real-Time Quotes Cache
          if (!db.objectStoreNames.contains('quotes_cache')) {
            const quoteStore = db.createObjectStore('quotes_cache', { keyPath: 'symbol' });
            quoteStore.createIndex('timestamp', 'timestamp', { unique: false });
            quoteStore.createIndex('source', 'source', { unique: false });
            quoteStore.createIndex('isLive', 'isLive', { unique: false });
          }

          // 3. Paper Trades Ledger
          if (!db.objectStoreNames.contains('paper_trades')) {
            const tradeStore = db.createObjectStore('paper_trades', { keyPath: 'id' });
            tradeStore.createIndex('symbol', 'symbol', { unique: false });
            tradeStore.createIndex('status', 'status', { unique: false });
            tradeStore.createIndex('entryTime', 'entryTime', { unique: false });
          }

          // 4. Trade Signals & Confluences
          if (!db.objectStoreNames.contains('signals_history')) {
            const signalStore = db.createObjectStore('signals_history', { keyPath: 'id' });
            signalStore.createIndex('symbol', 'symbol', { unique: false });
            signalStore.createIndex('timestamp', 'timestamp', { unique: false });
            signalStore.createIndex('direction', 'direction', { unique: false });
          }

          // 5. System Logs & Bot Audit Trail
          if (!db.objectStoreNames.contains('system_logs')) {
            const logStore = db.createObjectStore('system_logs', { keyPath: 'id' });
            logStore.createIndex('timestamp', 'timestamp', { unique: false });
            logStore.createIndex('level', 'level', { unique: false });
            logStore.createIndex('category', 'category', { unique: false });
          }

          // 6. Stream Telemetry & Latency Metrics
          if (!db.objectStoreNames.contains('stream_telemetry')) {
            db.createObjectStore('stream_telemetry', { keyPath: 'id' });
          }
        };

        request.onsuccess = (event: Event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          console.log('📦 [IndexedDB] Deep Persistent Database initialized successfully:', DB_NAME);
          resolve(this.db);
        };

        request.onerror = (event: Event) => {
          console.warn('⚠️ [IndexedDB] Error opening database:', (event.target as IDBOpenDBRequest).error);
          resolve(null);
        };
      } catch (err) {
        console.warn('⚠️ [IndexedDB] Exception during open:', err);
        resolve(null);
      }
    });

    return this.initPromise;
  }

  /**
   * Helper: Get object store transaction
   */
  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore | null> {
    const db = await this.initDatabase();
    if (!db) return null;
    try {
      const tx = db.transaction(storeName, mode);
      return tx.objectStore(storeName);
    } catch (err) {
      console.warn(`⚠️ [IndexedDB] Transaction error for store ${storeName}:`, err);
      return null;
    }
  }

  // ==================== APP STATE & SETTINGS ====================

  public async saveState<T>(key: string, value: T): Promise<boolean> {
    try {
      const store = await this.getStore('app_state', 'readwrite');
      if (!store) {
        localStorage.setItem(`mr_${key}`, JSON.stringify(value));
        return true;
      }
      return new Promise((resolve) => {
        const req = store.put({ key, value, updatedAt: Date.now() });
        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          localStorage.setItem(`mr_${key}`, JSON.stringify(value));
          resolve(false);
        };
      });
    } catch (e) {
      localStorage.setItem(`mr_${key}`, JSON.stringify(value));
      return false;
    }
  }

  public async setAppState<T>(key: string, value: T): Promise<boolean> {
    return this.saveState(key, value);
  }

  public async getState<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const store = await this.getStore('app_state', 'readonly');
      if (!store) {
        const local = localStorage.getItem(`mr_${key}`);
        return local ? JSON.parse(local) : defaultValue;
      }
      return new Promise((resolve) => {
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result && req.result.value !== undefined) {
            resolve(req.result.value as T);
          } else {
            const local = localStorage.getItem(`mr_${key}`);
            resolve(local ? JSON.parse(local) : defaultValue);
          }
        };
        req.onerror = () => {
          const local = localStorage.getItem(`mr_${key}`);
          resolve(local ? JSON.parse(local) : defaultValue);
        };
      });
    } catch (e) {
      const local = localStorage.getItem(`mr_${key}`);
      return local ? JSON.parse(local) : defaultValue;
    }
  }

  public async getAppState<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    return this.getState(key, defaultValue);
  }

  // ==================== MARKET QUOTES CACHE ====================

  public async saveQuotes(quotes: any[]): Promise<boolean> {
    if (!quotes || !quotes.length) return false;
    try {
      const store = await this.getStore('quotes_cache', 'readwrite');
      if (!store) return false;
      return new Promise((resolve) => {
        quotes.forEach(q => {
          if (q && q.symbol) {
            store.put({
              symbol: q.symbol,
              name: q.name || q.symbol,
              price: q.price,
              change24h: q.change24h,
              high24h: q.high24h,
              low24h: q.low24h,
              spread: q.spread,
              volume24h: q.volume24h,
              isLive: q.isLive !== false,
              source: q.source || 'WEBSOCKET',
              lastUpdated: q.lastUpdated || Date.now()
            });
          }
        });
        resolve(true);
      });
    } catch (e) {
      return false;
    }
  }

  public async getQuotes(): Promise<any[]> {
    try {
      const store = await this.getStore('quotes_cache', 'readonly');
      if (!store) return [];
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  // ==================== PAPER TRADES ====================

  public async saveTrades(trades: any[]): Promise<boolean> {
    if (!trades) return false;
    try {
      const store = await this.getStore('paper_trades', 'readwrite');
      if (!store) {
        localStorage.setItem('mr_paper_trades', JSON.stringify(trades));
        return true;
      }
      return new Promise((resolve) => {
        trades.forEach(t => {
          if (t && t.id) store.put(t);
        });
        resolve(true);
      });
    } catch (e) {
      return false;
    }
  }

  public async getTrades(): Promise<any[]> {
    try {
      const store = await this.getStore('paper_trades', 'readonly');
      if (!store) {
        const local = localStorage.getItem('mr_paper_trades');
        return local ? JSON.parse(local) : [];
      }
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  // ==================== TRADE SIGNALS ====================

  public async saveSignals(signals: any[]): Promise<boolean> {
    if (!signals) return false;
    try {
      const store = await this.getStore('signals_history', 'readwrite');
      if (!store) return false;
      return new Promise((resolve) => {
        // Keep last 150 signals
        signals.slice(0, 150).forEach(s => {
          if (s && s.id) store.put(s);
        });
        resolve(true);
      });
    } catch (e) {
      return false;
    }
  }

  public async getSignals(): Promise<any[]> {
    try {
      const store = await this.getStore('signals_history', 'readonly');
      if (!store) return [];
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  // ==================== SYSTEM LOGS ====================

  public async saveLogs(logs: any[]): Promise<boolean> {
    if (!logs || !logs.length) return false;
    try {
      const store = await this.getStore('system_logs', 'readwrite');
      if (!store) return false;
      return new Promise((resolve) => {
        logs.slice(-200).forEach(l => {
          if (l && l.id) store.put(l);
        });
        resolve(true);
      });
    } catch (e) {
      return false;
    }
  }

  public async getLogs(): Promise<any[]> {
    try {
      const store = await this.getStore('system_logs', 'readonly');
      if (!store) return [];
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result || []).sort((a: any, b: any) => b.timestamp - a.timestamp));
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  // ==================== STREAM TELEMETRY & LATENCY ====================

  public async saveTelemetry(telemetry: any): Promise<boolean> {
    if (!telemetry) return false;
    return this.saveState('stream_telemetry_snapshot', telemetry);
  }

  public async getTelemetry(): Promise<any | null> {
    return this.getState('stream_telemetry_snapshot', null);
  }

  // ==================== STORAGE STATISTICS & CLEAR ====================

  public async getStatistics(): Promise<IndexedDbStorageStats> {
    try {
      const [quotes, trades, signals, logs, settings, state] = await Promise.all([
        this.getQuotes(),
        this.getTrades(),
        this.getSignals(),
        this.getLogs(),
        this.getState('bot_settings'),
        this.getState('bot_status')
      ]);

      const rawJson = JSON.stringify({ quotes, trades, signals, logs, settings, state });
      const sizeBytes = new Blob([rawJson]).size;

      return {
        quotesCount: quotes.length,
        tradesCount: trades.length,
        signalsCount: signals.length,
        logsCount: logs.length,
        settingsSaved: !!settings,
        stateSaved: !!state,
        estimatedSizeKb: Math.round(sizeBytes / 1024 * 10) / 10,
        lastUpdated: Date.now(),
        dbName: DB_NAME,
        version: DB_VERSION
      };
    } catch (e) {
      return {
        quotesCount: 0,
        tradesCount: 0,
        signalsCount: 0,
        logsCount: 0,
        settingsSaved: false,
        stateSaved: false,
        estimatedSizeKb: 0,
        lastUpdated: Date.now(),
        dbName: DB_NAME,
        version: DB_VERSION
      };
    }
  }

  public async clearAll(): Promise<boolean> {
    try {
      const stores = ['app_state', 'quotes_cache', 'paper_trades', 'signals_history', 'system_logs', 'stream_telemetry'];
      const db = await this.initDatabase();
      if (!db) return false;
      const tx = db.transaction(stores, 'readwrite');
      stores.forEach(s => {
        try {
          tx.objectStore(s).clear();
        } catch (err) {
          // ignore
        }
      });
      localStorage.clear();
      console.log('🧹 [IndexedDB] Cleared all persistent cache object stores.');
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const indexedDb = new MarketIndexedDbService();
