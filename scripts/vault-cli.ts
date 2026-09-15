import { LocalVault } from '../server/localVault.js';

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help') {
  console.log(`
Baselpot Quant Brain - Secure Local Vault CLI
==============================================
Usage:
  npx tsx scripts/vault-cli.ts set <KEY> <VALUE> [PASSPHRASE]
  npx tsx scripts/vault-cli.ts get <KEY> [PASSPHRASE]
  npx tsx scripts/vault-cli.ts list [PASSPHRASE]
  `);
  process.exit(0);
}

const passphrase = args[3] || process.env.VAULT_PASSPHRASE || 'BaselpotQuantMasterSecret2026';
LocalVault.initializeVault(passphrase);

if (command === 'set') {
  const key = args[1];
  const value = args[2];
  if (!key || !value) {
    console.error('Error: Key and Value required');
    process.exit(1);
  }
  const ok = LocalVault.saveSecret(key, value);
  console.log(ok ? `[SUCCESS] Saved secret for key: ${key}` : `[FAILED] Could not save secret`);
} else if (command === 'get') {
  const key = args[1];
  if (!key) {
    console.error('Error: Key required');
    process.exit(1);
  }
  const val = LocalVault.getSecret(key);
  console.log(val ? `[FOUND] ${key} = ${val}` : `[NOT FOUND] No secret for key: ${key}`);
} else if (command === 'list') {
  const summary = LocalVault.getAuditSummary();
  console.log('[VAULT SUMMARY]', summary);
}
