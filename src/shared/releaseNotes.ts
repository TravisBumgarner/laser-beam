// Newest first. Add an entry with every version bump; the app shows the current version's notes once after updating.
export const RELEASE_NOTES: { version: string; notes: string[] }[] = [
  {
    version: '0.1.0',
    notes: [
      'Folder search: find folders anywhere on your Mac. Pick which folders and how deep.',
      'Results you pick get remembered and float to the top. ⌘⌫ forgets one.',
      'Scripts can run in Laser Beam or in a terminal.',
      'Ten new themes.',
      'Automatic backups.',
      'Open Laser Beam with ⌘Space instead of ⌥Space.',
    ],
  },
  { version: '0.0.3', notes: ['Automatic updates.'] },
  { version: '0.0.2', notes: ['Launch at login, on by default.', 'New app icon.'] },
  { version: '0.0.1', notes: ['First release.'] },
]
