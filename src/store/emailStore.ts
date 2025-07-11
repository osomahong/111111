import { create } from 'zustand';

interface EmailState {
  input: string;
  setInput: (v: string) => void;
  error: string;
  setError: (v: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export const useEmailStore = create<EmailState>((set) => ({
  input: '',
  setInput: (v) => set({ input: v }),
  error: '',
  setError: (v) => set({ error: v }),
  loading: false,
  setLoading: (v) => set({ loading: v }),
})); 