import { generateTemplateFiles } from "generate-template-files";

generateTemplateFiles([
    {
        option: "Create UI component",
        defaultCase: "(pascalCase)",
        entry: {
            folderPath: "./templates/templates/lit-component/",
        },
        stringReplacers: [
            { question: "Insert class name", slot: "__name__" },
            { question: "Insert directory name", slot: "__dirname__" },
        ],

        output: {
            path: "./lib/__dirname__(lowerCase)/__name__(pascalCase)",
            pathAndFileNameDefaultCase: "(pascalCase)",
            overwrite: true,
        },
    },
]);
