import { create } from 'zustand'

export type AuthState = object

export const useAuthStore = create<AuthState>()(() => ({}))
