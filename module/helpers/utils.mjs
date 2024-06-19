/**
 * Define a set of template paths to pre-load
 */
export const preloadHandlebarsTemplates = async function () {
    return loadTemplates([
      'modules/masks-newgeneration-unofficial/templates/sheets/actor-sheet.hbs',
      'modules/masks-newgeneration-unofficial/templates/parts/actor-header.hbs',
      'modules/masks-newgeneration-unofficial/templates/parts/actor-attributes.hbs',
      'modules/masks-newgeneration-unofficial/templates/parts/actor-movelist.hbs',
      'modules/masks-newgeneration-unofficial/templates/influences-tab-page.hbs',
    ]);
};