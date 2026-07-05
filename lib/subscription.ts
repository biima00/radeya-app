// ADDED CLAUDE AI: Subscription status helper functions
// Centralizes subscription expiry logic for consistent plan enforcement across API routes

type OrgWithSubscription = {
  subscriptionActive: boolean;
  subscriptionEnd: Date | null;
};

type OrgWithPlan = OrgWithSubscription & {
  plan: string;
};

export function isSubscriptionActive(org: OrgWithSubscription): boolean {
  if (!org.subscriptionActive) return false;
  if (org.subscriptionEnd && org.subscriptionEnd < new Date()) return false;
  return true;
}

export function getEffectivePlan(org: OrgWithPlan): string {
  return isSubscriptionActive(org) ? org.plan : 'FREE';
}
