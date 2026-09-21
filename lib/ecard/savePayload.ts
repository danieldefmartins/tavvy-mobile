import type { LinkItem } from './editorReducer';
/** The atomic RPC rejects unknown keys. Never send database counters or owner IDs. */
export function ecardLinkSavePayload(links: LinkItem[]) {
  return links.map((link, index) => ({ id: link.id, platform: link.platform || link.icon || 'other', title: link.title || '', url: link.url ?? (link as any).value ?? '', icon: link.icon || link.platform || 'other', sort_order: index, is_active: link.is_active === undefined ? true : link.is_active === true }));
}
