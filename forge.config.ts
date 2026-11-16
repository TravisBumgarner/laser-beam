import { MakerZIP } from '@electron-forge/maker-zip'
import { VitePlugin } from '@electron-forge/plugin-vite'
import type { ForgeConfig } from '@electron-forge/shared-types'

const shouldSign = process.env.SHOULD_APPLE_SIGN === '1'

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableName: 'laser-beam',
    icon: 'assets/icon',
    // Hardened runtime needs this for the osascript/System Events calls.
    extendInfo: { NSAppleEventsUsageDescription: 'Laser Beam pastes clips and arranges windows.' },
    osxSign: shouldSign
      ? {
          identity: process.env.APPLE_IDENTITY,
          optionsForFile: () => ({ hardenedRuntime: true, entitlements: 'entitlements.plist' }),
        }
      : undefined,
  },
  rebuildConfig: {},
  makers: [new MakerZIP({}, ['darwin'])],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'src/main/main.ts', config: 'vite.main.config.ts', target: 'main' },
        { entry: 'src/main/preload.ts', config: 'vite.preload.config.ts', target: 'preload' },
      ],
      renderer: [{ name: 'main_window', config: 'vite.renderer.config.ts' }],
    }),
  ],
  hooks: {
    postPackage: async (_forgeConfig, options) => {
      if (options.platform !== 'darwin' || !shouldSign) return
      const { notarize } = await import('@electron/notarize')
      await notarize({
        appPath: `${options.outputPaths[0]}/Laser Beam.app`,
        appleId: process.env.APPLE_ID as string,
        appleIdPassword: process.env.APPLE_PASSWORD as string,
        teamId: process.env.APPLE_TEAM_ID as string,
      })
    },
  },
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: { owner: 'TravisBumgarner', name: 'laser-beam' },
        prerelease: false,
        draft: false,
      },
    },
  ],
}

export default config
