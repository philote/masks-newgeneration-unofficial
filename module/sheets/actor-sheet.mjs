import { hideUngrantedConditions } from '../helpers/granted-conditions.mjs';
import { filterPlaybookChoices } from '../helpers/custom-playbook.mjs';

export function MasksActorSheetMixin(Base) {
	return class MasksActorSheet extends Base {
		// PbtA's actor sheet is still ApplicationV1, where `get template()` selects the
		// rendered .hbs file; this stops working if PbtA migrates to ApplicationV2.
		/** @override */
		get template() {
			return 'modules/masks-newgeneration-unofficial/templates/sheets/actor-sheet.hbs';
		}

		/** @override */
		async getData(options) {
			const context = await super.getData(options);
			if (context.playbooks) {
				context.playbooks = filterPlaybookChoices(context.playbooks, this.actor.system.playbook?.uuid);
			}
			return context;
		}

		/** @override */
		async _prepareAttrs(context) {
			await super._prepareAttrs(context);
			hideUngrantedConditions(context.system.attrLeft?.conditions, this.actor.items);
		}
	}
}
