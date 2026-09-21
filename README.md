# Tavvy Mobile

The Expo / React Native companion to Tavvy's place discovery, structured reviews,
business information, eCards and tools.

## Start here

- [Project memory](docs/PROJECT_MEMORY.md): shared product decisions and architecture.
- [Current engineering status](docs/PROJECT_STATUS.md): what is live, prepared or unfinished.
- [Contributor handoff](AGENTS.md): continuation and preservation rules.
- [Web repository](https://github.com/danieldefmartins/tavvy-web).

The active workspace contains changes beyond committed `main`. Recent tested builds
used frozen source snapshots; do not assume a local change is in an uploaded EAS build
or that any internal preview has been submitted to Apple.

## Development

Current stack: Expo 53, React Native 0.79, React 19 and TypeScript. Use the existing
npm lockfile and obtain approved local configuration from the maintainer.

```sh
npm ci
npm start
```

```sh
npm run typecheck
npm run ios
```

`npm run ios` builds/runs locally and requires the native toolchain. Use the established
EAS profile and release process for cloud builds. Check existing native modifications
before running clean or prebuild commands.

## Main source areas

- `App.tsx` and `types/navigation.ts`: route registration and navigation contracts.
- `screens/`: discovery, place details, tools and owner workflows.
- `screens/ecard/`, `components/ecard/`, `lib/ecard/`: card creation, editing and preview.
- `config/eCardTemplates.ts`: template/palette identities shared with web.
- `i18n/locales/`: languages; `contexts/ThemeContext.tsx`: device/Light/Dark behavior.
- `supabase/`: backend source, released separately from the native binary.

## Release and parity

Web and mobile should offer equivalent product behavior where applicable. Test actual
device navigation, permissions, theme changes and previews; web checks are insufficient.
Keep every existing eCard feature and design, and preserve real customer content.

Final iPhone/iPad screenshots, language checks, account deletion, moderation and the
digital-purchase strategy are tracked in the status document. Update that document
after releases and keep private data, credentials and signing material outside Git.
