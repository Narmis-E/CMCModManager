import type { ForgeConfig } from "@electron-forge/shared-types";
// import { MakerSquirrel } from "@electron-forge/maker-squirrel";
// import { MakerZIP } from "@electron-forge/maker-zip";
// import { MakerDeb } from "@electron-forge/maker-deb";
// import { MakerRpm } from "@electron-forge/maker-rpm";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
    },
    rebuildConfig: {},
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                authors: "Inferno214221",
                name: "CMC Mod Manager",
                iconUrl: "https://github.com/Inferno214221/CMCModManager/blob/main/gb/cmcmm.ico",
            },
        },
        {
            name: "@electron-forge/maker-zip",
            platforms: ["darwin", "linux", "win32"],
            config: {}
        },
        {
            name: "@electron-forge/maker-deb",
            config: {
                productName: "CMC Mod Manager",
                name: "cmc-mod-manager",
                description: "A mod manager for CMC+ v8 made with Electron",
                license: "GNU General Public License v3.0",
                categories: ["Utility"],
                icon: "./gb/icon.png",
                version: "2.4.0",
            },
        },
        {
            name: "@electron-forge/maker-rpm",
            config: {
                productName: "CMC Mod Manager",
                name: "cmc-mod-manager",
                description: "A mod manager for CMC+ v8 made with Electron",
                license: "GNU General Public License v3.0",
                categories: ["Utility"],
                icon: "./gb/icon.png",
                version: "2.4.0",
            },
        },
        // new MakerSquirrel({}),
        // new MakerZIP({}, ["darwin"]),
        // new MakerRpm({}),
        // new MakerDeb({})
    ],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new WebpackPlugin({
            mainConfig,
            devContentSecurityPolicy:
                "default-src'self' https://fonts.gstatic.com img://* 'unsafe-inline' \
                'unsafe-eval'",
            renderer: {
                config: rendererConfig,
                entryPoints: [
                    {
                        html: "./src/ui/global/global.html",
                        js: "./src/renderer.ts",
                        name: "main_window",
                        preload: {
                            js: "./src/preload.ts",
                        },
                    },
                ],
            },
        }),
    ],
};

export default config;