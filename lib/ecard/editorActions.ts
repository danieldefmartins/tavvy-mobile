/** Publication is a separate action and cannot succeed after a failed/stale save. */
export async function saveBeforePublishing(save: () => Promise<boolean>, publish: () => Promise<void>): Promise<boolean> {
  if (!await save()) return false;
  await publish();
  return true;
}

/** Approved Pro extras plus the existing native link/template/testimonial rules. */
export function nativeECardRequiresPro(card: { [key: string]: any; blocks?: { type?: string }[] }, links: { is_active?: boolean | null }[], premiumTemplate: boolean): boolean {
  return premiumTemplate || links.filter(link => link.is_active === undefined || link.is_active === true).length > 5 || hasProExtras(card) || (Array.isArray(card.blocks) && card.blocks.some(block => block.type === 'testimonials'));
}
import { hasProExtras } from './premiumContent';
