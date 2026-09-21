/** Publication is a separate action and cannot succeed after a failed/stale save. */
export async function saveBeforePublishing(save: () => Promise<boolean>, publish: () => Promise<void>): Promise<boolean> {
  if (!await save()) return false;
  await publish();
  return true;
}

/** Approved Pro extras plus the existing template/testimonial rules. */
export function nativeECardRequiresPro(card: { [key: string]: any; blocks?: { type?: string }[] }, links: { is_active?: boolean | null }[], premiumTemplate: boolean): boolean {
  return ecardDesignRequiresPro({ template_id: card.template_id, color_scheme_id: card.color_scheme_id, theme: card.theme }) || premiumTemplate || hasProExtras(card) || (Array.isArray(card.blocks) && card.blocks.some(block => block.type === 'testimonials'));
}
import { hasProExtras } from './premiumContent';

import { ecardDesignRequiresPro } from './designAccess';
