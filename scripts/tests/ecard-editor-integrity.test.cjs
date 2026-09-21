const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
function load(file) { const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../../', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText; const exports = {}; new Function('require', 'exports', code)(specifier => { if (!specifier.startsWith('.')) throw new Error('Unexpected dependency'); return load(path.join(path.dirname(file), specifier) + '.ts'); }, exports); return exports; }
const { editorReducer, initialEditorState } = load('lib/ecard/editorReducer.ts');
const { ecardLinkSavePayload } = load('lib/ecard/savePayload.ts');
const { saveBeforePublishing } = load('lib/ecard/editorActions.ts');
const { createECardPreviewMessage, parseECardPreviewMessage, safePreviewUrl } = load('lib/ecard/previewBridge.ts');
const card = { id: 'card', full_name: 'Original', title: 'Original title', template_id: 'basic', is_published: false, pro_credentials: { license_number: 'existing' } };
const links = [{ id: '11111111-1111-4111-8111-111111111111', card_id: 'card', platform: 'website', title: 'Portfolio', url: 'https://example.com', sort_order: 0, is_active: true, clicks: 25 }, { id: '22222222-2222-4222-8222-222222222222', platform: 'email', title: 'Email', url: 'mailto:test@example.com', sort_order: 1, is_active: false, clicks: 7 }];
const loaded = () => editorReducer(initialEditorState, { type: 'LOAD_CARD', card, links });
test('failed save keeps typed work, links and pending uploads for retry', () => { let state = editorReducer(loaded(), { type: 'SET_FIELD', field: 'title', value: 'New title' }); state = editorReducer(state, { type: 'SET_PENDING_UPLOAD', key: 'profile_photo', upload: { uri: 'file://photo.jpg', type: 'image/jpeg' } }); const before = state; state = editorReducer(state, { type: 'MARK_SAVE_ERROR', error: 'network failed' }); assert.equal(state.card.title, 'New title'); assert.equal(state.links, before.links); assert.equal(state.pendingUploads, before.pendingUploads); assert.equal(state.isDirty, true); assert.equal(state.saveError, 'network failed'); });
test('save completion never overwrites newer edits or uploads', () => { let state = editorReducer(loaded(), { type: 'SET_FIELD', field: 'title', value: 'Saving title' }); const snapshot = { card: state.card, links: state.links, pendingUploads: state.pendingUploads }; state = editorReducer(state, { type: 'SET_FIELD', field: 'title', value: 'Typed during save' }); state = editorReducer(state, { type: 'SAVE_COMPLETED', snapshot, persisted: { title: 'Saving title' } }); assert.equal(state.card.title, 'Typed during save'); assert.equal(state.isDirty, true); });
test('real reorder preserves IDs, inactive rows and clicks; invalid moves are ignored', () => { const initial = loaded(); const reordered = editorReducer(initial, { type: 'REORDER_LINKS', fromIndex: 1, toIndex: 0 }); assert.deepEqual(reordered.links.map(l => [l.id, l.sort_order, l.clicks]), [[links[1].id, 0, 7], [links[0].id, 1, 25]]); assert.equal(reordered.links[0].is_active, false); assert.equal(editorReducer(initial, { type: 'REORDER_LINKS', fromIndex: -1, toIndex: 0 }), initial); assert.equal(editorReducer(initial, { type: 'REORDER_LINKS', fromIndex: 0, toIndex: 2 }), initial); });
test('atomic link payload retains stable identities and hides database-only metadata', () => { const payload = ecardLinkSavePayload(links); assert.equal(payload[0].id, links[0].id); assert.equal(payload[1].is_active, false); assert.deepEqual(Object.keys(payload[0]).sort(), ['id', 'platform', 'title', 'url', 'icon', 'sort_order', 'is_active'].sort()); assert.equal(payload[0].clicks, undefined); assert.equal(payload[0].card_id, undefined); });
test('publish is never attempted after failed or stale save', async () => { let writes = 0; assert.equal(await saveBeforePublishing(async () => false, async () => { writes++; }), false); assert.equal(writes, 0); const steps = []; assert.equal(await saveBeforePublishing(async () => { steps.push('save'); return true; }, async () => { steps.push('publish'); }), true); assert.deepEqual(steps, ['save', 'publish']); await assert.rejects(saveBeforePublishing(async () => true, async () => { throw new Error('server denied'); }), /server denied/); });
test('publication status preserves concurrent unsaved edits', () => { let state = editorReducer(loaded(), { type: 'SET_FIELD', field: 'bio', value: 'Typed while publishing' }); state = editorReducer(state, { type: 'PUBLICATION_UPDATED', published: true }); assert.equal(state.card.is_published, true); assert.equal(state.card.bio, 'Typed while publishing'); assert.equal(state.isDirty, true); });
test('preview preserves unsaved template/link order without showing inactive links', () => { const message = createECardPreviewMessage({ ...card, full_name: 'Current edit', template_id: 'business-card' }, [links[1], links[0]]); const preview = parseECardPreviewMessage(message); assert.equal(preview.card.full_name, 'Current edit'); assert.equal(preview.card.template_id, 'business-card'); assert.deepEqual(preview.links.map(l => l.id), [links[0].id]); assert.equal(links.length, 2); });
test('preview rejects malformed, oversized and script-capable content', () => { assert.equal(parseECardPreviewMessage('{bad'), null); assert.equal(parseECardPreviewMessage({ type: 'other', card, links }), null); assert.equal(parseECardPreviewMessage({ type: 'tavvy-ecard-preview', card: { ...card, title: {} }, links }), null); assert.equal(parseECardPreviewMessage({ type: 'tavvy-ecard-preview', card: { ...card, bio: 'x'.repeat(1024 * 1024) }, links }), null); for (const url of ['javascript:alert(1)', 'data:text/html,<script>', 'file:///private/photo', 'https://user:pass@example.com/a', 'https://example.com/\nsecret']) assert.equal(safePreviewUrl(url, true), ''); const preview = parseECardPreviewMessage(createECardPreviewMessage({ ...card, profile_photo_url: 'file://pending.jpg', access_token: 'should-not-travel' }, [{ ...links[0], url: 'javascript:alert(1)' }])); assert.equal(preview.card.profile_photo_url, ''); assert.equal(preview.card.access_token, undefined); assert.equal(preview.links[0].url, ''); assert.equal(safePreviewUrl('mailto:person@example.com'), 'mailto:person@example.com'); });
function mockedAutoSave({ rpcError = null, pending = false, cardFields = {} } = {}) {
  let current = editorReducer(loaded(), { type: 'SET_FIELD', field: 'title', value: 'Saved title' });
  current = { ...current, card: { ...current.card, ...cardFields } };
  if (pending) { current = editorReducer(current, { type: 'SET_FIELD', field: 'profile_photo_url', value: 'file://photo.jpg' }); current = editorReducer(current, { type: 'SET_PENDING_UPLOAD', key: 'profile_photo', upload: { uri: 'file://photo.jpg', type: 'image/jpeg' } }); }
  const calls = [], filters = [], uploads = [], refs = [];
  const db = { from: name => { assert.equal(name, 'digital_cards'); return { update: payload => { calls.push(['card', payload]); const chain = { eq: (...args) => { filters.push(args); return chain; }, select: () => chain, single: async () => ({ data: { id: 'card' }, error: null }) }; return chain; } }; }, rpc: async (name, payload) => { calls.push([name, payload]); return { data: null, error: rpcError }; }, storage: { from: () => ({ upload: async (name, bytes) => { uploads.push(bytes); return { data: { path: name }, error: null }; }, getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/owned-photo.jpg' } }) }) } };
  const deps = { react: { useRef: value => { const ref = { current: value }; refs.push(ref); return ref; }, useEffect: () => {}, useCallback: fn => fn }, './EditorContext': { useEditor: () => ({ state: current, dispatch: action => { current = editorReducer(current, action); } }) }, '../../lib/supabaseClient': { supabase: db }, '../../config/eCardTemplates': { getTemplateById: () => ({ isPremium: false }) }, 'expo-file-system': { EncodingType: { Base64: 'base64' }, readAsStringAsync: async () => 'AQID' }, 'base64-arraybuffer': require('base64-arraybuffer'), './savePayload': { ecardLinkSavePayload } };
  const source = fs.readFileSync(path.join(__dirname, '../../lib/ecard/useAutoSave.ts'), 'utf8'); const exports = {}; const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('require', 'exports', code)(name => { if (!(name in deps)) throw new Error('Unexpected dependency ' + name); return deps[name]; }, exports);
  return { hook: exports.useAutoSave({ userId: 'owner', isPro: false }), calls, filters, uploads, state: () => current };
}
test('actual autosave uses owner filtering, atomic whitelisted links and native byte uploads', async () => { const run = mockedAutoSave({ pending: true }); assert.equal(await run.hook.saveNow(), true); assert.deepEqual(run.filters, [['id', 'card'], ['user_id', 'owner']]); assert.equal(run.uploads[0] instanceof ArrayBuffer, true); assert.deepEqual([...new Uint8Array(run.uploads[0])], [1, 2, 3]); assert.equal(run.calls[1][0], 'replace_ecard_links'); assert.equal(run.calls[1][1].p_links[0].card_id, undefined); assert.equal(run.calls[1][1].p_links[1].is_active, false); assert.equal(run.state().card.profile_photo_url, 'https://example.com/owned-photo.jpg'); assert.equal(run.state().isDirty, false); });
test('actual atomic link failure does not report saved or publish', async () => { const run = mockedAutoSave({ rpcError: { message: 'network unavailable' } }); const original = console.error; console.error = () => {}; let published = false; try { assert.equal(await saveBeforePublishing(run.hook.saveNow, async () => { published = true; }), false); } finally { console.error = original; } assert.equal(published, false); assert.equal(run.state().card.title, 'Saved title'); assert.equal(run.state().isDirty, true); assert.match(run.state().saveError, /Links could not be saved/); assert.equal(run.state().lastSaved, null); });

test('actual unrelated save preserves approved badges and all historical gallery metadata', async () => {
  const gallery = [{ id: 'legacy', uri: 'https://example.com/photo.jpg', caption: 'Existing caption', custom: { crop: 'portrait' } }];
  const run = mockedAutoSave({ cardFields: { show_licensed_badge: true, badge_approval_status: 'approved', gallery_images: gallery } });
  assert.equal(await run.hook.saveNow(), true);
  assert.equal(run.calls[0][1].badge_approval_status, undefined);
  assert.equal(run.state().card.badge_approval_status, 'approved');
  assert.deepEqual(run.calls[0][1].gallery_images, gallery);
});
test('an orphan local gallery photo stops saving instead of silently deleting it', async () => {
  const gallery = [{ id: 'pending', url: 'file://unavailable.jpg', caption: 'Keep this' }];
  const run = mockedAutoSave({ cardFields: { gallery_images: gallery } });
  const original = console.error;console.error = () => {};
  try { assert.equal(await run.hook.saveNow(), false); } finally { console.error = original; }
  assert.equal(run.calls.length, 0);
  assert.deepEqual(run.state().card.gallery_images, gallery);
  assert.equal(run.state().isDirty, true);
});

function renderFeatureSection(file, isPro, cardFields = {}, chooseVideo = false) {
  const alerts = [], actions = [], pickerCalls = [], uploadedBytes = [];
  const React = { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }), useCallback: fn => fn, useState: value => [chooseVideo && value === 'youtube' ? 'tavvy_short' : value, () => {}] };
  const native = { StyleSheet: { create: value => value }, Dimensions: { get: () => ({ width: 390 }) }, Alert: { alert: (...args) => alerts.push(args) } };
  for (const name of ['View', 'Text', 'TouchableOpacity', 'Image', 'Modal', 'TextInput', 'ScrollView', 'ActivityIndicator', 'Switch']) native[name] = name;
  const deps = { '../../../../hooks/useReleaseCopy': { useReleaseCopy: () => message => message }, react: { ...React, default: React }, 'react-native': native, '@react-navigation/native': { useNavigation: () => ({ navigate: () => {} }) }, '@expo/vector-icons': { Ionicons: 'Ionicons' }, 'expo-image-picker': { requestMediaLibraryPermissionsAsync: async () => { pickerCalls.push('permission'); return { status: 'granted' }; }, launchImageLibraryAsync: async () => { pickerCalls.push('picker'); return chooseVideo ? { canceled: false, assets: [{ uri: 'file://chosen.mp4', mimeType: 'video/mp4' }] } : { canceled: true }; } }, '../../../../lib/ecard/EditorContext': { useEditor: () => ({ state: { card: { ...card, ...cardFields } }, dispatch: action => actions.push(action) }) }, 'expo-file-system': { EncodingType: { Base64: 'base64' }, readAsStringAsync: async () => 'AQID' }, 'base64-arraybuffer': require('base64-arraybuffer'), '../../../../lib/supabaseClient': { supabase: { auth: { getSession: async () => ({ data: { session: { user: { id: 'owner' } } } }) }, storage: { from: () => ({ upload: async (path, bytes) => { uploadedBytes.push(bytes); return { data: { path }, error: null }; }, getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/chosen.mp4' } }) }) } } }, '../shared/EditorSection': { default: 'EditorSection' }, '../shared/EditorField': { default: 'EditorField' }, '../../../../lib/ecard/formBlock': load('lib/ecard/formBlock.ts') };
  const exports = {}, source = fs.readFileSync(path.join(__dirname, '../../', file), 'utf8');
  new Function('require', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React } }).outputText)(name => { if (!(name in deps)) throw new Error('Unavailable test dependency ' + name); return deps[name]; }, exports);
  const tree = exports.default({ isDark: false, isPro }), nodes = [];
  function walk(node) { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) { node.forEach(walk); return; } nodes.push(node); walk(node.props?.children); }
  walk(tree);
  const text = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('') : node?.props ? text(node.props.children) : '';
  return { nodes, text, alerts, actions, pickerCalls, uploadedBytes };
}
test('Free add-media controls show Pro before opening a picker or video modal', async () => {
  const run = renderFeatureSection('components/ecard/editor/sections/MediaSection.tsx', false);
  for (const label of ['Add images · Pro', 'Add video · Pro']) {
    const button = run.nodes.find(node => node.type === 'TouchableOpacity' && run.text(node) === label);
    assert(button, 'Visible Pro label: ' + label); await button.props.onPress();
  }
  assert.equal(run.alerts.length, 2); assert.deepEqual(run.pickerCalls, []); assert.deepEqual(run.actions, []);
});
test('Pro media add still opens the existing picker flow', async () => {
  const run = renderFeatureSection('components/ecard/editor/sections/MediaSection.tsx', true);
  await run.nodes.find(node => node.type === 'TouchableOpacity' && run.text(node) === 'Add images · Pro').props.onPress();
  assert.deepEqual(run.pickerCalls, ['permission', 'picker']); assert.deepEqual(run.alerts, []);
});
test('Free form activation is explained before changes; an existing form can be disabled without data loss', () => {
  const file = 'components/ecard/editor/sections/AdvancedSection.tsx';
  const disabled = renderFeatureSection(file, false, { form_block: { enabled: false, webhookUrl: 'https://example.com/lead' } });
  disabled.nodes.find(node => node.props?.label === 'Show contact form on card').props.onToggle();
  assert.equal(disabled.alerts.length, 1); assert.deepEqual(disabled.actions, []);
  const existing = renderFeatureSection(file, false, { form_block: { enabled: true, webhookUrl: 'https://example.com/lead' } });
  existing.nodes.find(node => node.props?.label === 'Show contact form on card').props.onToggle();
  assert.equal(existing.alerts.length, 0); assert.equal(existing.actions[0].value.enabled, false); assert.equal(existing.actions[0].value.webhookUrl, 'https://example.com/lead');
});

test('legacy null visibility stays hidden and intentional empty URLs remain empty', () => { const payload = ecardLinkSavePayload([{ ...links[0], is_active: null, url: '', value: 'https://old.example.com' }, { ...links[1], is_active: undefined, url: null, value: 'mailto:legacy@example.com' }]); assert.equal(payload[0].is_active, false); assert.equal(payload[0].url, ''); assert.equal(payload[1].is_active, true); assert.equal(payload[1].url, 'mailto:legacy@example.com'); const preview = parseECardPreviewMessage({ type: 'tavvy-ecard-preview', card, links: [{ ...links[0], is_active: null }] }); assert.equal(preview.links.length, 0); });

test('form visibility toggle preserves every existing integration field', () => { const { setFormBlockEnabled, visibleFormBlock } = load('lib/ecard/formBlock.ts'); const original = { formType: 'webhook', webhookUrl: 'https://example.com/lead', fields: ['name', 'email'], custom: { retained: true } }; const hidden = setFormBlockEnabled(JSON.stringify(original), false); assert.equal(visibleFormBlock(hidden), null); const shown = setFormBlockEnabled(hidden, true); assert.deepEqual(shown, { ...original, enabled: true }); });

test('preview bridge accepts only its own origin or an explicit native injection context', () => { const { isECardPreviewEventAllowed: allow } = load('lib/ecard/previewBridge.ts'); assert.equal(allow('https://tavvy.com', true, 'https://tavvy.com', false), true); assert.equal(allow('https://evil.example', true, 'https://tavvy.com', true), false); assert.equal(allow('null', true, 'https://tavvy.com', false), false); assert.equal(allow('', true, 'https://tavvy.com', false), false); assert.equal(allow('null', false, 'https://tavvy.com', true), false); assert.equal(allow('null', true, 'https://tavvy.com', true), true); });

test('preview validates nested renderer data and accepts historical serialized JSON', () => {
  for (const fields of [{ pronouns: {} }, { videos: [{ type: 'youtube' }] }, { gallery_images: [null] }, { form_block: { fields: 'invalid' } }, { form_block: { fields: [{ label: {} }] } }, { menu_items: [{ category: 'Lunch' }] }, { testimonials: [{ reviewText: {} }] }]) {
    assert.equal(parseECardPreviewMessage({ type: 'tavvy-ecard-preview', card: { ...card, ...fields }, links }), null);
  }
  const preview = parseECardPreviewMessage({ type: 'tavvy-ecard-preview', card: { ...card, gallery_images: JSON.stringify([{ id: 'image', url: 'https://example.com/image.jpg', caption: 'Current photo' }]), form_block: JSON.stringify({ enabled: false, fields: [{ id: 'name', type: 'text', label: 'Name' }] }) }, links });
  assert.equal(preview.card.gallery_images[0].caption, 'Current photo');
  assert.equal(preview.card.form_block.enabled, false);
});

test('approved native Pro extras use meaningful content while five active links remain Free', () => {
  const { nativeECardRequiresPro } = load('lib/ecard/editorActions.ts');
  const free = { gallery_images: [], videos: [], pro_credentials: { licensed: false, insured: false, yearsInBusiness: 0 }, form_block: { enabled: false, webhookUrl: 'https://example.com/keep' } };
  assert.equal(nativeECardRequiresPro(free, Array.from({ length: 5 }, () => ({ is_active: true })), false), false);
  assert.equal(nativeECardRequiresPro({}, Array.from({ length: 6 }, () => ({ is_active: true })), false), true);
  assert.equal(nativeECardRequiresPro({}, [], true), true);
  for (const extra of [{ gallery_images: [{ uri: 'https://example.com/image.jpg' }] }, { videos: [{ url: 'https://example.com/video.mp4' }] }, { youtube_video_id: 'abc123' }, { form_block: { enabled: true } }, { pro_credentials: { license_number: '0' } }, { blocks: [{ type: 'form', data: { enabled: true } }] }]) assert.equal(nativeECardRequiresPro(extra, [], false), true);
  assert.equal(nativeECardRequiresPro({ blocks: [{ type: 'gallery', data: { images: [] } }] }, [], false), false);
  assert.equal(nativeECardRequiresPro({ blocks: [{ type: 'form' }] }, [], false), true);
  assert.equal(nativeECardRequiresPro({}, [...Array.from({ length: 5 }, () => ({ is_active: true })), { is_active: false }, { is_active: null }], false), false);
  assert.equal(nativeECardRequiresPro({ blocks: [{ type: 'testimonials' }] }, [], false), true);
});
test('shared Pro classification handles historical JSON, disabled content and never modifies existing data', () => {
  const { getProExtras } = load('lib/ecard/premiumContent.ts');
  const existing = { is_published: true, gallery_images: JSON.stringify([{ uri: 'https://example.com/old.jpg', caption: 'Keep' }]), videos: [{ videoId: 'abc123' }], pro_credentials: JSON.stringify([{ license: '1234' }]), form_block: JSON.stringify({ formType: 'webhook', webhookUrl: 'https://example.com/lead' }) };
  const before = JSON.stringify(existing);assert.deepEqual(getProExtras(existing), ['gallery', 'video', 'form', 'credentials']);assert.equal(JSON.stringify(existing), before);
  assert.deepEqual(getProExtras({ gallery_images: [{ url: '' }], videos: [{ url: ' ' }], pro_credentials: [], form_block: { enabled: false } }), []);
  assert.deepEqual(getProExtras({ form_block: {} }), ['form']);
  assert.deepEqual(getProExtras({ blocks: [{ type: 'gallery', enabled: false, data: { images: [{ url: 'https://example.com/a.jpg' }] } }, { type: 'credentials', data: { enabled: false, license: '1234' } }, { type: 'video', data: { url: 'https://example.com/v.mp4' } }] }), ['video']);
});

test('legacy visibility flags cannot hide rendered media from the Pro check', () => {
  const { getProExtras } = load('lib/ecard/premiumContent.ts');
  assert.deepEqual(getProExtras({ gallery_images: [{ url: 'https://example.com/photo.jpg', enabled: false }], videos: [{ url: 'https://example.com/video.mp4', visible: false }], form_block: { visible: false, title: 'Contact' } }), ['gallery', 'video', 'form']);
});

test('approved Pro video upload sends native file bytes, not a URI object', async () => {
  const run = renderFeatureSection('components/ecard/editor/sections/MediaSection.tsx', true, {}, true);
  const button = run.nodes.find(node => node.type === 'TouchableOpacity' && run.text(node) === 'Choose Video from Device');assert(button);
  await button.props.onPress();assert.equal(run.uploadedBytes[0] instanceof ArrayBuffer, true);assert.deepEqual([...new Uint8Array(run.uploadedBytes[0])], [1, 2, 3]);assert.deepEqual(run.alerts, []);
});
