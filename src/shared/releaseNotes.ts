// Newest first. Add an entry with every version bump; the app shows the current version's notes once after updating.
export const RELEASE_NOTES: { version: string; notes: string[] }[] = [
  {
    version: '0.4.1',
    notes: ['Added diagnostic logging to help track down Laser Beam opening on the wrong desktop.'],
  },
  {
    version: '0.4.0',
    notes: [
      '⌘↵ (or ⌘-click) opens an app or folder in a new window on the desktop you are on.',
      'Apps that are already running show an Open badge.',
    ],
  },
  {
    version: '0.3.1',
    notes: ['Fixed Laser Beam sometimes opening on a different desktop than the one you are on.'],
  },
  {
    version: '0.3.0',
    notes: ['Folder search can now find Desktop, Documents and Downloads. Grant access in Settings → Permissions.'],
  },
  {
    version: '0.2.0',
    notes: [
      'Script params: add them in the editor, use {{name}} in the command, and fill them in right in the search bar.',
      'Redesigned script editor.',
      "Setup wizard on first launch, plus a Permissions tab, so macOS permission prompts don't interrupt you later.",
      'Laser Beam now opens over full-screen apps.',
      'Presets open new windows on your current desktop.',
      'Shows an Indexing badge while folders are being indexed.',
      'New installs search your home folder, one level deep.',
      'Hovering no longer selects a result until the mouse moves.',
    ],
  },
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
