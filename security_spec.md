# Security Specification: Baselpot Trading Platform

## 1. Data Invariants
1. **User Isolation**: A user cannot read, create, update, or delete another user's profile, settings, trade history, or watchlist entries (`request.auth.uid == userId`).
2. **Identity Integrity**: For any write to `/users/{userId}/*`, the document's `userId` field must match `request.auth.uid`.
3. **Public Signals Read**: Trading signals under `/signals/{signalId}` are readable by signed-in users, but writes are restricted to administrative system functions.
4. **Zero Client Claims Reliance**: Administrative permissions are strictly verified against database state, never from unverified client claims.
5. **Type & Bounds Enforceability**: All strings and IDs have strict size caps (max 128 chars for IDs, regex matching `^[a-zA-Z0-9_\-]+$`) and enumerated state guards.

## 2. The Dirty Dozen Payloads (Rejection Matrix)
| # | Test Case | Target Path | Payload / Attack Vector | Expected Result |
|---|-----------|-------------|-------------------------|-----------------|
| 1 | Unauthenticated Read | `/users/user_123` | `auth = null` reading user profile | `PERMISSION_DENIED` |
| 2 | Cross-User Profile Read | `/users/user_victim` | `auth.uid = 'user_attacker'` | `PERMISSION_DENIED` |
| 3 | Cross-User Profile Update | `/users/user_victim` | `auth.uid = 'user_attacker'`, changing displayName | `PERMISSION_DENIED` |
| 4 | Identity Spoofing in Trade | `/users/user_123/trades/tr_1` | `auth.uid = 'user_123'`, payload with `userId = 'user_victim'` | `PERMISSION_DENIED` |
| 5 | Giant ID Injection (Poisoning) | `/users/user_123/trades/{1KB_string}` | String size > 128 characters | `PERMISSION_DENIED` |
| 6 | Ghost Field Shadow Update | `/users/user_123/settings/main` | Injected `isAdmin: true` into settings payload | `PERMISSION_DENIED` |
| 7 | Invalid Enums (State Corruption)| `/users/user_123/trades/tr_1` | `status: "ILLEGAL_STATUS"` | `PERMISSION_DENIED` |
| 8 | Unbounded Array Injection | `/users/user_123/watchlist/w_1` | Massive oversized array injection | `PERMISSION_DENIED` |
| 9 | Direct Signal Modification by User | `/signals/SIG-101` | Normal user attempting `deleteDoc` / `setDoc` | `PERMISSION_DENIED` |
| 10| Unauthenticated Signal Reading | `/signals/SIG-101` | `auth = null` accessing private signals | `PERMISSION_DENIED` |
| 11| Self-Privilege Escalation | `/admins/user_123` | User attempting to create admin doc | `PERMISSION_DENIED` |
| 12| Negative Price / NaN Injection | `/users/user_123/trades/tr_1` | `entryPrice: -500.0` or invalid type | `PERMISSION_DENIED` |
