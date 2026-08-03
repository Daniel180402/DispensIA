import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'it.daniel.dispensia',
  appName: 'DispensIA',
  webDir: 'dist',
  android: {
    // il server di casa è in http, la webview parte da https://localhost
    allowMixedContent: true,
  },
}

export default config
