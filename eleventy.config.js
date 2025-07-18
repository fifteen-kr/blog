//@ts-check

import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

import pluginFilters from "./_config/filters.js";

import markdownItFootnote from "markdown-it-footnote";
import markdownItKatex_wrap from "@vscode/markdown-it-katex";
import { alert as markdownItAlert } from "@mdit/plugin-alert";

const markdownItKatex = markdownItKatex_wrap['default'];

import postcss from "postcss";
import cssnano from "cssnano";

const CSSNANO_CONFIG = {
    preset: 'default',
};

const POSTCSS_INSTANCE = postcss([cssnano(CSSNANO_CONFIG)]);

/** @param {import("@11ty/eleventy/UserConfig").default} eleventyConfig */
export default async function(eleventyConfig) {
    eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
        if(data.draft && process.env.ELEVENTY_RUN_MODE === 'build') return false;
    });

    eleventyConfig.addPassthroughCopy({
        "./public/": "/",
    });

    eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpeg,jpg}");
    
    eleventyConfig.addBundle("css", {
        toFileDirectory: "dist",
        transforms: [
            async function(content) {
                return await POSTCSS_INSTANCE.process(content, {from: (void 0)});
            },
        ],
    });

    eleventyConfig.addBundle("js", {toFileDirectory: "dist"});

    // OFficial Plugins
    eleventyConfig.addPlugin(pluginSyntaxHighlight, {
        preAttributes: {tabindex: 0},
        errorOnInvalidLanguages: true,
    });
    eleventyConfig.addPlugin(pluginNavigation);
    eleventyConfig.addPlugin(HtmlBasePlugin);
    eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

    eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        extensions: "html",
        formats: ['avif', 'webp', 'auto'],
        defaultAttributes: {
            loading: 'lazy',
            decoding: 'async',
        },
    });

    // Markdown
    eleventyConfig.amendLibrary("md", (md) => {
        md.use(markdownItFootnote);
        md.use(markdownItKatex);
        md.use(markdownItAlert);
    });

    // Filters
    eleventyConfig.addPlugin(pluginFilters);
    eleventyConfig.addPlugin(IdAttributePlugin, {});

    eleventyConfig.addShortcode("currentBuildDate", () => (new Date()).toISOString());
};

export const config = {
    templateFormats: ['md', 'njk', 'html', "11ty.js"],

    markdownTemplateEngine: "njk",

    htmlTemplateEngine: "njk",

    dir: {
        input: "content",
		includes: "../_include",
		data: "../_data",
        output: "_site",
    },
};