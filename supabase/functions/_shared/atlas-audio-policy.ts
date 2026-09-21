/** Paid narration is an internal producer operation; public/user JWTs cannot write it. */
export function authorizeAudioProducer(request: Request, key: string | undefined, headers: HeadersInit = {}): Response | null {
  const common = { ...Object.fromEntries(new Headers(headers)), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (!key?.trim()) return new Response(JSON.stringify({ success: false, error: 'Audio producer unavailable' }), { status: 503, headers: common });
  if (request.headers.get('Authorization') !== `Bearer ${key}`) return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: common });
  return null;
}

const clean = (value: unknown): string => typeof value === 'string' ? value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim() : '';
const primary = (block: any) => clean(block?.text || block?.content);
const item = (value: any): string => typeof value === 'string' ? clean(value) : [clean(value?.time), clean(value?.title), clean(value?.activity), primary(value), clean(value?.description)].filter(Boolean).join('. ');
function blockText(block: any): string {
  switch (block?.type) {
    case 'heading': case 'paragraph': case 'h1': case 'h2': case 'h3': return primary(block);
    case 'list': case 'bullet_list': case 'numbered_list': case 'checklist': case 'itinerary_day': return [clean(block.title), ...(block.items || []).map(item)].filter(Boolean).join('. ');
    case 'callout': case 'tip_box': return [clean(block.title), primary(block)].filter(Boolean).join('. ');
    case 'quote': return [primary(block), clean(block.author)].filter(Boolean).join('. ');
    case 'image': return clean(block.caption);
    case 'itinerary': return [clean(block.title), ...(block.days || []).flatMap((day: any) => [clean(day.title), ...(day.items || []).map(item)])].filter(Boolean).join('. ');
    case 'divider': case 'place_card': return '';
    default: throw new Error('Unsupported article block');
  }
}

/** Never send a silently shortened article to Polly. Long articles use the complete staged pipeline. */
export function completePollyText(article: any): string {
  const body = Array.isArray(article.content_blocks) && article.content_blocks.length ? article.content_blocks.map(blockText).filter(Boolean).join('. ') : clean(article.content);
  if (body.length < 40) throw new Error('Article body unavailable');
  const text = [clean(article.title), clean(article.excerpt), body].filter(Boolean).join('. ');
  if (text.length > 2900) throw new Error('Use the complete narration pipeline for this article');
  return text;
}
