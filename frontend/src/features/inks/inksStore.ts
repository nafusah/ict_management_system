import { create } from 'zustand'

export type InksState = object

export const useInksStore = create<InksState>()(() => ({}))
