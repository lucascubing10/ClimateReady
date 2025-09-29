// constants/env.ts

// Use your PC’s IPv4 (from ipconfig) + port 4000
export const API_BASE = __DEV__
  ? 'http://192.168.100.180:4000'
  : 'https://your-prod-api';

  