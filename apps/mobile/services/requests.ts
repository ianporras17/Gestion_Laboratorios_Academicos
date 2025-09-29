import axios from 'axios';
import type { RequestCreatePayload, RequestDetail, RequestRow, RequestMessage } from '../types/requests';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const API = `${BASE}/requests`;

export const RequestsApi = {
  async create(payload: RequestCreatePayload): Promise<RequestDetail> {
    const { data } = await axios.post(API, payload);
    return data;
  },
  async list(params: {
    lab_id?: number; from?: string; to?: string; status?: string; requirements_ok?: boolean;
  } = {}): Promise<RequestRow[]> {
    const { data } = await axios.get(API, { params });
    return data;
  },
  async get(id: number): Promise<RequestDetail> {
    const { data } = await axios.get(`${API}/${id}`);
    return data;
  },
  async approve(id: number, body: { reviewer_id?: number; reviewer_note?: string }): Promise<RequestDetail> {
    const { data } = await axios.post(`${API}/${id}/approve`, body);
    return data;
  },
  async reject(id: number, body: { reviewer_id?: number; reviewer_note?: string }): Promise<RequestDetail> {
    const { data } = await axios.post(`${API}/${id}/reject`, body);
    return data;
  },
  async needInfo(id: number, body: { reviewer_id?: number; reviewer_note?: string; message?: string }): Promise<RequestDetail> {
    const { data } = await axios.post(`${API}/${id}/need-info`, body);
    return data;
  },
  async addMessage(id: number, body: { sender: 'USUARIO'|'ENCARGADO'; message: string }): Promise<RequestMessage> {
    const { data } = await axios.post(`${API}/${id}/messages`, body);
    return data;
  },
};
