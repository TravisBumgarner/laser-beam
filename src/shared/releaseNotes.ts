// Newest first. Add an entry with every version bump; the app shows the current version's notes once after updating.
export const RELEASE_NOTES: { version: string; notes: string[] }[] = [
  {
    version: '0.1.0',
    notes: [
      'Folder search: find folders anywhere on your Mac. Pick which folders and how deep in Settings → Search.',
      'Results you pick get remembered and float to the top. ⌘⌫ forgets one.',
      'Scripts show a preview of their code, and can run in Laser Beam or in a terminal (Terminal, iTerm, Ghostty, kitty, WezTerm, Alacritty).',
      'Themes: ten new themes in Settings → Theme.',
      'Automatic backups, weekly on Monday by default. Change it in Settings → Backup.',
      'td_ is hidden when Todo Today isn’t installed.',
      'Open Laser Beam with ⌘Space instead of ⌥Space (Settings → General). Turn off Spotlight’s shortcut first.',
      'Release notes live in the bottom left of Settings.',
    ],
  },
  { version: '0.0.3', notes: ['Automatic updates.'] },
  { version: '0.0.2', notes: ['Launch at login, on by default.', 'New app icon.'] },
  { version: '0.0.1', notes: ['First release.'] },
]
