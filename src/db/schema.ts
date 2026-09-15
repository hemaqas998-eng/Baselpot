import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table linked to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Trading Signals table
export const tradingSignals = pgTable('trading_signals', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull(),
  direction: text('direction').notNull(),
  entryPrice: text('entry_price').notNull(),
  stopLoss: text('stop_loss').notNull(),
  takeProfit: text('take_profit').notNull(),
  timeframe: text('timeframe').default('15m'),
  status: text('status').default('PENDING'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Paper Trades table
export const paperTrades = pgTable('paper_trades', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  symbol: text('symbol').notNull(),
  direction: text('direction').notNull(),
  lotSize: text('lot_size').notNull(),
  entryPrice: text('entry_price').notNull(),
  exitPrice: text('exit_price'),
  pnl: text('pnl'),
  status: text('status').notNull().default('OPEN'),
  openedAt: timestamp('opened_at').defaultNow(),
  closedAt: timestamp('closed_at'),
});

// Quantitative Engine & Synergy Logs
export const quantitativeLogs = pgTable('quantitative_logs', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull(),
  hurstExponent: text('hurst_exponent'),
  coherence: text('coherence'),
  kellyLot: text('kelly_lot'),
  dominantState: text('dominant_state'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  trades: many(paperTrades),
}));

export const paperTradesRelations = relations(paperTrades, ({ one }) => ({
  user: one(users, {
    fields: [paperTrades.userId],
    references: [users.id],
  }),
}));
