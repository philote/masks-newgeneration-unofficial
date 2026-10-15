/**
 * Moves where a high roll is the bad outcome and a miss is the good one, so
 * their chat card swaps the success/failure colours (partial is unchanged).
 * Only the colour flips: pbta's own `success`/`failure` class stays on the
 * result row, since mark-potential.mjs keys its button off `.failure`.
 * Matched against the rolled Item's exact `name`, same convention as
 * move-potential-map.mjs.
 */
export const INVERTED_RESULT_MOVE_NAMES = new Set(["Take a Powerful Blow"]);

export function initInvertedResultColors() {
    Hooks.on("renderChatMessageHTML", (message, html) => {
        const itemUuid = message.getFlag("pbta", "itemUuid");
        if (!itemUuid) { return; }

        const resultRow = html.querySelector(".pbta-chat-card .row.result");
        if (!resultRow) { return; }

        // Sync lookup so the class lands before the card paints; it throws for
        // documents embedded in a compendium, which just keep normal colours.
        let item;
        try {
            item = fromUuidSync(itemUuid);
        } catch {
            return;
        }

        if (INVERTED_RESULT_MOVE_NAMES.has(item?.name)) {
            resultRow.classList.add("masks-result-inverted");
        }
    });
}
