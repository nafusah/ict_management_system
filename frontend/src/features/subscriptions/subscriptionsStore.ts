import { create } from 'zustand'

export type SubscriptionsState = object

export const useSubscriptionsStore = create<SubscriptionsState>()(() => ({}))
