// constants/env.ts

// Use your PC’s IPv4 (from ipconfig) + port 4000
export const API_BASE = __DEV__
  ? 'http://10.33.200.191:4000'
  : 'https://your-prod-api';
