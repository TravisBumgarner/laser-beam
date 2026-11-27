import { execFile } from 'node:child_process'

// Built-in system commands, searchable like apps. Paths are synthetic ids, never real files.
const run = (file: string, args: string[]) =>
  new Promise<string>((resolve, reject) =>
    execFile(file, args, { timeout: 10000 }, (error, stdout) => (error ? reject(error) : resolve(stdout.trim()))),
  )

const applescript = (script: string) => run('osascript', ['-e', script])
const jxa = (script: string) => run('osascript', ['-l', 'JavaScript', '-e', script])

const wifiDevice = async () => {
  const ports = await run('networksetup', ['-listallhardwareports'])
  return ports.match(/Hardware Port: Wi-Fi\nDevice: (\S+)/)?.[1] ?? 'en0'
}

const ACTIONS: { name: string; run: () => Promise<unknown> }[] = [
  {
    name: 'Toggle Dark Mode',
    run: () =>
      applescript('tell application "System Events" to tell appearance preferences to set dark mode to not dark mode'),
  },
  {
    name: 'Lock Screen',
    run: () => applescript('tell application "System Events" to keystroke "q" using {control down, command down}'),
  },
  { name: 'Sleep', run: () => run('pmset', ['sleepnow']) },
  { name: 'Empty Trash', run: () => applescript('tell application "Finder" to empty trash') },
  {
    name: 'Toggle Wi-Fi',
    run: async () => {
      const device = await wifiDevice()
      const on = (await run('networksetup', ['-getairportpower', device])).endsWith('On')
      await run('networksetup', ['-setairportpower', device, on ? 'off' : 'on'])
    },
  },
  {
    name: 'Toggle Bluetooth',
    run: () =>
      jxa(`ObjC.import("IOBluetooth")
ObjC.bindFunction("IOBluetoothPreferenceGetControllerPowerState", ["int", []])
ObjC.bindFunction("IOBluetoothPreferenceSetControllerPowerState", ["void", ["int"]])
$.IOBluetoothPreferenceSetControllerPowerState($.IOBluetoothPreferenceGetControllerPowerState() ? 0 : 1)`),
  },
  {
    name: 'Show Desktop',
    run: () => run('/System/Applications/Mission Control.app/Contents/MacOS/Mission Control', ['1']),
  },
  {
    name: 'Eject All Disks',
    run: () => applescript('tell application "Finder" to eject (every disk whose ejectable is true)'),
  },
  // The loginwindow events show macOS's own confirmation dialog, so a stray ↵ can't restart the Mac.
  { name: 'Restart', run: () => applescript('tell application "loginwindow" to «event aevtrrst»') },
  { name: 'Shut Down', run: () => applescript('tell application "loginwindow" to «event aevtrsdn»') },
]

export const SYSTEM_ACTIONS = ACTIONS.map((a) => ({ name: a.name, path: `action:${a.name}` }))

export const runSystemAction = async (path: string) => {
  const action = ACTIONS.find((a) => `action:${a.name}` === path)
  if (!action) return false
  await action.run()
  return true
}
