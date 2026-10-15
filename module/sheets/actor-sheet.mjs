import { hideUngrantedConditions } from '../helpers/granted-conditions.mjs';
import { filterPlaybookChoices } from '../helpers/custom-playbook.mjs';
import { adjustMoveHold, moveHasHoldStepper, moveHoldValue, setMoveHold } from '../helpers/move-hold.mjs';

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

		/** @override */
		async _prepareItems(context) {
			await super._prepareItems(context);
			for (const moves of Object.values(context.moves ?? {})) {
				for (const move of moves) {
					if (moveHasHoldStepper(move)) move.masksHold = { value: moveHoldValue(move) };
				}
			}
		}

		/** @override */
		activateListeners(html) {
			super.activateListeners(html);
			if (!this.isEditable) return;

			const root = html[0];
			const moveFor = (element) => this.actor.items.get(element.closest("[data-item-id]")?.dataset.itemId);

			root.querySelectorAll(".masks-move-hold__control").forEach((button) => {
				button.addEventListener("click", (event) => {
					event.preventDefault();
					adjustMoveHold(moveFor(button), button.dataset.holdAction);
				});
			});

			// No `name` attribute keeps this out of the actor's form data; stopping
			// propagation keeps the sheet's own change handler from submitting.
			root.querySelectorAll(".masks-move-hold__input").forEach((input) => {
				input.addEventListener("change", (event) => {
					event.stopPropagation();
					setMoveHold(moveFor(input), input.value);
				});
			});
		}
	}
}
