import axios from "axios";

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const api = axios.create({
  baseURL: API_URL,  
  timeout: 10000,
});
