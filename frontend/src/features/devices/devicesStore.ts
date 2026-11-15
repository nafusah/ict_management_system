import { create } from 'zustand'

export type DevicesState = object

export const useDevicesStore = create<DevicesState>()(() => ({}))
