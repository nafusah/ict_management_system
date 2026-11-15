import { create } from 'zustand'

export type SettingsState = object

export const useSettingsStore = create<SettingsState>()(() => ({}))
