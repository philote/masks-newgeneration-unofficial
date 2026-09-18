import { adjustTeamPool, postTeamPoolToChat } from "../helpers/team-pool-utils.mjs";

// Built lazily (called from initTeamPool() during the "init" hook) rather than
// referencing foundry.applications.* at module-import time, matching
// MasksActorSheetMixin's (actor-sheet.mjs) same lazy-construction convention.
export function createTeamPoolActorSheet() {
    const { HandlebarsApplicationMixin } = foundry.applications.api;
    const { ActorSheetV2 } = foundry.applications.sheets;

    return class TeamPoolActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
        static DEFAULT_OPTIONS = {
            classes: ["masks-newgeneration-unofficial", "team-pool-sheet"],
            position: { width: 320, height: "auto" },
            actions: {
                increase: TeamPoolActorSheet.#onIncrease,
                decrease: TeamPoolActorSheet.#onDecrease,
                postToChat: TeamPoolActorSheet.#onPostToChat,
            },
        };

        static PARTS = {
            form: { template: "modules/masks-newgeneration-unofficial/templates/sheets/team-pool-sheet.hbs" },
        };

        async _prepareContext(options) {
            const context = await super._prepareContext(options);
            context.pool = this.actor.system.pool;
            context.atZero = context.pool <= 0;
            return context;
        }

        // A quick badge pulse whenever the pool actually changes, so a +/- click
        // (yours or another connected player's) reads as an obvious, satisfying
        // beat rather than a number silently updating.
        async _onRender(context, options) {
            await super._onRender(context, options);

            const badge = this.element.querySelector(".team-pool-sheet__badge");
            if (badge && this._previousPool !== undefined && this._previousPool !== context.pool) {
                badge.classList.remove("team-pool-sheet__badge--pulse");
                void badge.offsetWidth;
                badge.classList.add("team-pool-sheet__badge--pulse");
            }
            this._previousPool = context.pool;
        }

        static async #onIncrease() {
            await adjustTeamPool(this.actor, 1);
        }

        static async #onDecrease() {
            await adjustTeamPool(this.actor, -1);
        }

        static async #onPostToChat() {
            await postTeamPoolToChat(this.actor);
        }
    };
}
