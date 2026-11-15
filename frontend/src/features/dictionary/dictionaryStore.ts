import { create } from 'zustand'

export type DictionaryState = object

export const useDictionaryStore = create<DictionaryState>()(() => ({}))
