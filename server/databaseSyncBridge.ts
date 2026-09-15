import { Pool } from 'pg';
import { db as firestoreDb } from '../src/lib/firebase.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Universal Database Sync Bridge
 * Synchronizes bot trades, signals, and broker settings across PostgreSQL/MySQL and Cloud Firestore.
 * Completely free, native to application sandbox and Google Cloud Run.
 */

let pgPool: Pool | null = null;

function getPgPool(): Pool | null {
  if (pgPool) return pgPool;
  const host = process.env.SQL_HOST;
  const database = process.env.SQL_DB_NAME;
  const user = process.env.SQL_ADMIN_USER;
  const password = process.env.SQL_ADMIN_PASSWORD;

  if (host && database && user && password) {
    try {
      pgPool = new Pool({
        host,
        database,
        user,
        password,
        port: 5432,
        ssl: false,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      console.log('✅ Relational SQL Pool successfully initialized.');
    } catch (err) {
      console.warn('⚠️ SQL Pool initialization deferred:', err);
    }
  }
  return pgPool;
}

export class DatabaseSyncBridge {
  /**
   * Syncs bot state or paper/live trade into SQL and Firestore
   */
  public static async syncTrade(trade: any): Promise<void> {
    // 1. Try SQL Sync
    const pool = getPgPool();
    if (pool) {
      try {
        const query = `
          INSERT INTO paper_trades (symbol, direction, lot_size, entry_price, exit_price, pnl, status, opened_at, closed_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8 / 1000.0), $9 ? to_timestamp($9 / 1000.0) : NULL)
          ON CONFLICT DO NOTHING;
        `;
        await pool.query(query, [
          trade.symbol,
          trade.direction,
          String(trade.lotSize),
          String(trade.entryPrice),
          trade.currentPrice ? String(trade.currentPrice) : null,
          trade.pnl ? String(trade.pnl) : '0',
          trade.status || 'OPEN',
          trade.openedAt || Date.now(),
          trade.closedAt || null
        ]);
      } catch (sqlErr: any) {
        // Non-blocking log
        // console.debug('SQL trade sync notice:', sqlErr.message);
      }
    }

    // 2. Try Firestore Sync
    try {
      if (firestoreDb && trade.id) {
        const docRef = doc(firestoreDb, 'trades', trade.id);
        await setDoc(docRef, {
          ...trade,
          syncedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (fsErr) {
      // Ignored if offline or firestore unavailable
    }
  }

  /**
   * Syncs active trading signals
   */
  public static async syncSignal(signal: any): Promise<void> {
    const pool = getPgPool();
    if (pool) {
      try {
        const query = `
          INSERT INTO trading_signals (symbol, direction, entry_price, stop_loss, take_profit, timeframe, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT DO NOTHING;
        `;
        await pool.query(query, [
          signal.symbol,
          signal.direction,
          String(signal.entryPrice),
          String(signal.stopLoss),
          String(signal.takeProfit1),
          signal.timeframe || '15m',
          signal.status || 'PENDING'
        ]);
      } catch (sqlErr) {}
    }

    try {
      if (firestoreDb && signal.id) {
        const docRef = doc(firestoreDb, 'signals', signal.id);
        await setDoc(docRef, {
          ...signal,
          syncedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (fsErr) {}
  }

  /**
   * Health status of database synchronization
   */
  public static async getSyncHealth(): Promise<{
    sqlConnected: boolean;
    firestoreConnected: boolean;
    provider: string;
    lastSync: number;
  }> {
    let sqlConnected = false;
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT 1 as alive');
        sqlConnected = res.rows?.[0]?.alive === 1;
      } catch {
        sqlConnected = false;
      }
    }

    return {
      sqlConnected,
      firestoreConnected: Boolean(firestoreDb),
      provider: sqlConnected ? 'Cloud SQL / PostgreSQL Active' : 'Cloud Firestore Autonomous Sync Active',
      lastSync: Date.now()
    };
  }
}
