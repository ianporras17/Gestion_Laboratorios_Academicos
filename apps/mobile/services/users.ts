  // services/users.ts
  import axios from "axios";
  const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "") + "/api";

  export type UserHistoryRow = {
  kind: 'RESERVA' | 'ASIGNACION' | 'CONSUMO' | 'BENEFICIO' | 'CAPACITACION';
  ref_id: number;
  lab_id: number | null;
  at: string | null; // ISO
  state: string | null;
  purpose: string | null;
  resource_id: number | null;
  qty: number | null;
  hours: number | null;
  credits: number | null;
};

  export const UsersApi = {
    me: async () => {
      const { data } = await axios.get(`${BASE}/users/me`);
      return data;
    },
    updateMe: async (payload: {
      full_name?: string; student_id?: string; teacher_code?: string;
      program_department?: string; phone?: string;
    }) => {
      const { data } = await axios.put(`${BASE}/users/me`, payload);
      return data;
    },
    myTrainings: async () => {
      const { data } = await axios.get(`${BASE}/users/me/trainings`);
      return data as any[];
    },
    upsertTraining: async (payload: { training_id: number; completed_at?: string; expires_at?: string }) => {
      const { data } = await axios.post(`${BASE}/users/me/trainings`, payload);
      return data;
    },
    labRequirements: async (lab_id: number) => {
      const { data } = await axios.get(`${BASE}/users/me/lab-requirements`, { params: { lab_id } });
      return data as { lab_id:number; user_id:number; eligible:boolean; items:any[] };
    },

    history: async () => {
    const { data } = await axios.get(`${BASE}/users/me/history`);
    return data as UserHistoryRow[];
    },

    historyCsv: async (): Promise<string> => {
      const { data } = await axios.get(`${BASE}/users/me/history`, {
        params: { format: 'csv' },
        responseType: 'text',
      });
      return data as string;
    },
  };
