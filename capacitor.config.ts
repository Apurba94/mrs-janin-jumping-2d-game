// Paper-Cut Dash Android wrapper: packages the static Mrs Janin game into a native WebView shell.
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "space.mrsjanin.runner",
  appName: "Mrs Janin",
  webDir: "dist/public",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
  },
};

export default config;
