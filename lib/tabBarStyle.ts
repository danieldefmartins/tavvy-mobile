/** Bottom tab bar style. Shared so a screen can hide the bar (e.g. photo menu) and restore exactly this. */
export function tabBarStyle(isDark: boolean) {
  return {
    backgroundColor: isDark ? '#0F0F0F' : '#FAFAFA',
    borderTopColor: 'transparent',
    borderTopWidth: 0,
    height: 85,
    paddingBottom: 20,
    paddingTop: 8,
  } as const;
}
