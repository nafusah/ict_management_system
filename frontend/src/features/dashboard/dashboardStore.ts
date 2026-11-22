import { create } from 'zustand'

export type DashboardState = object

export const useDashboardStore = create<DashboardState>()(() => ({}))
