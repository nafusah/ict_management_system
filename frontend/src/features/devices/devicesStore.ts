import { request } from '../../shared/data/api'
import { createCollection } from '../../shared/data/createCollection'
import type { Classification, CustodyRecord, Device, DeviceCondition } from '../../shared/data/types'

export const devicesStore = createCollection<Device>('devices', 'DEV', '/devices')
export const useDevicesStore = devicesStore.useStore
export const useDevices = () => devicesStore.useStore((s) => s.items)

// ---------------------------------------------------------------
// سجل العهدة
// ---------------------------------------------------------------

export function fetchCustodyHistory(deviceId: string): Promise<CustodyRecord[]> {
  return request.get<CustodyRecord[]>(`/devices/${encodeURIComponent(deviceId)}/custody`)
}

export interface CustodyMovePayload {
  date?: string
  condition?: DeviceCondition | null
  notes?: string | null
}

function applyDevice(updated: Device) {
  devicesStore.setAll(devicesStore.getAll().map((d) => (d.id === updated.id ? updated : d)))
}

export async function transferDeviceCustody(
  deviceId: string,
  payload: CustodyMovePayload & { toEmployee: string; toDepartment: string; classification?: Classification },
): Promise<CustodyRecord> {
  const res = await request.post<{ device: Device; record: CustodyRecord }>(
    `/devices/${encodeURIComponent(deviceId)}/transfer`,
    payload,
  )
  applyDevice(res.device)
  return res.record
}

export async function returnDeviceToStorage(deviceId: string, payload: CustodyMovePayload): Promise<CustodyRecord> {
  const res = await request.post<{ device: Device; record: CustodyRecord }>(
    `/devices/${encodeURIComponent(deviceId)}/return`,
    payload,
  )
  applyDevice(res.device)
  return res.record
}
