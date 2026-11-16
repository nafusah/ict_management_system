import { createCollection } from '../../shared/data/createCollection'
import { SEED_SUBSCRIPTIONS } from '../../shared/data/seed'
import type { Subscription } from '../../shared/data/types'

export const subscriptionsStore = createCollection<Subscription>(
  'subscriptions',
  'SUB',
  SEED_SUBSCRIPTIONS,
  '/subscriptions',
)

export const useSubscriptionsStore = subscriptionsStore.useStore
export const useSubscriptions = () => subscriptionsStore.useStore((s) => s.items)
