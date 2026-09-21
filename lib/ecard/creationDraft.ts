import { getTemplateById } from '../../config/eCardTemplates';
import { canUseTemplate } from './templateSelection';
import { templateDesignDefaults } from './templatePreviewData';

export interface CreationValues { name: string; title: string; photoUri?: string; primaryColor?: string }
export function applyDesignColor<T extends CreationValues>(values: T, primaryColor: string): T {
  return { ...values, primaryColor };
}
/** Whitelist user-entered identity and reusable decoration. Display examples never enter a draft. */
export function createCardDraftPayload(input: {
  userId: string; slug: string; templateId: string; schemeId: string | null;
  cardType: string; countryCode?: string; values: CreationValues; photoUrl?: string; isPro: boolean;
}) {
  const template = getTemplateById(input.templateId);
  if (!template || !canUseTemplate(template, input.schemeId, input.isPro)) throw new Error('This design or color requires Pro. Choose an available option or review your plan.');
  const scheme = template.colorSchemes.find(item => item.id === input.schemeId)!;
  const name = input.values.name.trim();
  if (name.length < 2) throw new Error('Please add your name or business name.');
  if (!['business', 'personal', 'politician'].includes(input.cardType)) throw new Error('Choose a valid card type.');
  const primary = /^#[\da-f]{6}$/i.test(input.values.primaryColor || '') ? input.values.primaryColor! : scheme.primary;
  return {
    ...templateDesignDefaults(template), user_id: input.userId, slug: input.slug, full_name: name,
    template_id: template.id, color_scheme_id: scheme.id, card_type: input.cardType,
    gradient_color_1: primary, gradient_color_2: primary === scheme.primary ? scheme.secondary || primary : primary,
    is_published: false, is_active: true,
    ...(input.values.title.trim() ? { title: input.values.title.trim() } : {}),
    ...(input.photoUrl ? { profile_photo_url: input.photoUrl } : {}),
    ...(input.cardType === 'politician' && input.countryCode ? { country_code: input.countryCode } : {}),
  };
}
