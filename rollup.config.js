import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";
import del from "rollup-plugin-delete";
import injectProcessEnv from "rollup-plugin-inject-process-env";
import summary from "rollup-plugin-summary";

console.log(process.argv);

const DEV_MODE = process.argv.indexOf("--config-dev") != -1;

if (DEV_MODE) {
    console.log(DEV_MODE ? "DEVELOPMENT BUILD" : "PRODUCTION BUILD");
}

const SHOELACE_ASSET_ROOT =
    "node_modules/@shoelace-style/shoelace/dist/assets/icons";
const SHOELACE_ICONS = [
    "plus",
    "dash-lg",
    "geo-alt",
    "bounding-box-circles",
    "circle",
    "circle-fill",
    "arrow-counterclockwise",
    "arrow-clockwise",
    "moon-fill",
    "moon",
    "app",
    "arrows-move",
    "trash3",
    "grip-horizontal",
    "caret-right-fill",
    "info-circle",
    "plus-lg",
    "cursor-fill",
    "pencil-fill",
    "arrows-move",
];

function getShoelaceIconTargets(destDir) {
    return SHOELACE_ICONS.map((x) => {
        return {
            src: `${SHOELACE_ASSET_ROOT}/${x}.svg`,
            dest: `${destDir}/assets/shoelace/assets/icons`,
        };
    });
}

function makeCopyTargets(destDir) {
    return [
        { src: "src/version.json", dest: `${destDir}/dist/` },
        { src: "./.dist/*", dest: `${destDir}/dist/` },
        {
            src: "node_modules/lit-fontawesome/css/font.css",
            dest: `${destDir}/assets/fontawesome/`,
        },
        ...getShoelaceIconTargets(destDir),
        {
            src: "node_modules/@shoelace-style/shoelace/dist/themes/dark.css",
            dest: `${destDir}/assets/shoelace/`,
        },
        {
            src: "node_modules/@shoelace-style/shoelace/dist/themes/light.css",
            dest: `${destDir}/assets/shoelace/`,
        },
        {
            src: "node_modules/leaflet/dist/leaflet.css",
            dest: `${destDir}/assets/`,
        },
        {
            src: "node_modules/mapbox-gl/dist/mapbox-gl.css",
            dest: `${destDir}/assets/`,
        },
    ];
}

export default {
    input: "lib/index.ts",
    output: [
        {
            dir: "./site/dist/",
            format: "es",
            name: "ds-geo-editor.esm.js",
            sourcemap: true,
            plugins: DEV_MODE ? [] : [terser()],
            chunkFileNames: () => {
                return "chunk-[hash].js";
            },
        },
    ],
    onwarn(warning) {
        if (
            warning.code !== "THIS_IS_UNDEFINED" &&
            warning.message.indexOf("Circular dependency") === -1
        ) {
            console.error(`${warning.message}`);
        }
    },
    plugins: [
        del({
            targets: ["./site/dist/*"],
        }),
        json(),
        commonjs(),
        injectProcessEnv(
            {
                NODE_ENV: "production",
            },
            {
                exclude: "**/*.css",
                verbose: false,
            }
        ),
        resolve({
            browser: true,
            preferBuiltins: false,
        }),
        typescript({
            tsconfig: "./tsconfig.json",
            outDir: "./site/dist/.ts-output",
        }),
        summary(),
        copy({
            hook: "writeBundle",
            preventAssignment: true,
            targets: [...makeCopyTargets(`site`)],
        }),
    ],
};
