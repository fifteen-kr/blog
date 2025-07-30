export default {
    eleventyComputed: {
        docId({page}) {
            const src = page.url || page.filePathStem || page.inputPath || "";
            return src
                .replace(/\/index\/?$/, '/')
                .replace(/[^a-z0-9]+/gi, '-')
                .replace(/(^-|-$)/g, '');
        }
    }
};