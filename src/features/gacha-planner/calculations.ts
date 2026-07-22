export const HARD_PITY = 90;
export const STELLAR_JADE_PER_PULL = 160;

export interface WishlistPlanInput {
  targetCount: number;
  currentTickets: number;
  pity: number;
  guaranteed: boolean;
}

export interface WishlistPlan {
  worstCasePulls: number;
  ticketShortfall: number;
  stellarJadeShortfall: number;
}

export function calculateWishlistPlan(input: WishlistPlanInput): WishlistPlan {
  let worstCasePulls = 0;
  let pity = clampInteger(input.pity, 0, HARD_PITY);
  let guaranteed = input.guaranteed;

  for (let index = 0; index < input.targetCount; index += 1) {
    const pullsToNextFiveStar = Math.max(0, HARD_PITY - pity);
    worstCasePulls += guaranteed ? pullsToNextFiveStar : pullsToNextFiveStar + HARD_PITY;
    pity = 0;
    guaranteed = false;
  }

  const ticketShortfall = Math.max(0, worstCasePulls - Math.max(0, input.currentTickets));

  return {
    worstCasePulls,
    ticketShortfall,
    stellarJadeShortfall: ticketShortfall * STELLAR_JADE_PER_PULL,
  };
}

export function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.trunc(value)));
}
