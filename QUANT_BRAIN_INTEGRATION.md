# Baselpot + Quant Brain Architecture: Unified Integration Overview
========================================================================

## 1. System Architecture & Core Philosophy
Baselpot is an institutional-grade, multi-asset algorithmic trading bot engineered with:
- **Albert Quant Algorithms & Quantum Trading Brain v4**: Continuous Hilbert Space state vector mapping ($|\Psi\rangle = \alpha|\text{BULL}\rangle + \beta|\text{BEAR}\rangle + \gamma|\text{RANGE}\rangle$), Shannon & Von Neumann entropy state collapse, and dynamic fractional Kelly risk allocation.
- **Dual AI Consensus Engine**: Parallel zero-shot reasoning combining Gemini 2.5 Flash with DeepSeek V3 for multi-agent trade verification.
- **High-Speed WebSocket Ingestion**: Low-latency Tiingo WebSocket pipeline streaming live Forex, Crypto, Indices, and Commodities with sub-5ms pricing engine.
- **Operational Guardrails**: Real-time drawdown circuit breakers, max open exposure constraints, and high-spread anti-slippage guards.
- **Encrypted Local Vault**: AES-256-GCM local keystore protecting broker API keys and credentials.

---

## 2. Mathematical Frameworks
1. **Hilbert Space Representation**:
   $$|\Psi\rangle = \alpha|\text{BULL}\rangle + \beta|\text{BEAR}\rangle + \gamma|\text{RANGE}\rangle, \quad |\alpha|^2 + |\beta|^2 + |\gamma|^2 = 1.0$$
2. **Von Neumann & Shannon Entropy**:
   $$S(\rho) = -\sum_{i} p_i \log_2(p_i)$$
3. **Fractional Kelly Criterion**:
   $$f^* = \frac{p \cdot b - q}{b} \times \kappa \times \Omega_{\text{vol}}$$
   where $\kappa = 0.25$ (Quarter-Kelly safety cap) and $\Omega_{\text{vol}}$ is the volatility penalty multiplier.
4. **Hurst Exponent ($H$)**:
   Distinguishes persistent trends ($H > 0.5$) from mean-reverting ranges ($H < 0.5$).

---

## 3. API Endpoints
- `GET /api/quant-brain/status`: Real-time state vector & coherence metrics.
- `POST /api/quant-brain/evaluate-signal`: Deep quantum confluence calculation on trade signals.
- `POST /api/quant-brain/run-full-audit`: Automated diagnostic test suite execution.
- `POST /api/security/unlock`: Local vault passphrase unlock.
- `POST /api/security/save-credentials`: AES-256-GCM encrypted credential persistence.
