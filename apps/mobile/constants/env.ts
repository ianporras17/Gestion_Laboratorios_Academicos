export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const API_BASE_URL = API_URL || 'http://localhost:3000/api';
