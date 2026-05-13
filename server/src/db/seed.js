import { ensureDemoAccount } from './demoData.js';

const result = ensureDemoAccount({ reset: true });

console.log(`Seeded demo data for ${result.user.name}.`);
console.log('Login: username "demo", password "demo"');
