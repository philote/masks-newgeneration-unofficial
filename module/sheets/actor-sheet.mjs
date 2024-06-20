export function MasksActorSheetMixin(Base) {
	return class MasksActorSheet extends Base {
		/** @override */
		get template() {
			return 'modules/masks-newgeneration-unofficial/templates/sheets/actor-sheet.hbs';
		}

		/** @override */
		// async getData() {
		// 	const context = await super.getData();
		// 	return context;
		// }
	}
}