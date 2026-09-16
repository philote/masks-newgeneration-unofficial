import { shouldOfferMarkPotential, getPotentialAttribute, isPotentialFull, markPotential } from "./mark-potential-utils.mjs";

const MODULE_ID = "masks-newgeneration-unofficial";

/**
 * Adds a "Mark Potential" button to a move roll's chat card when that move's
 * failure result says to mark Potential. Visible only to the GM or the
 * rolling actor's owner; grayed out (but still shown) once Potential is
 * full; removed for everyone once someone has clicked it, via a flag on the
 * chat message itself.
 */
export function initMarkPotentialButton() {
    Hooks.on("renderChatMessageHTML", async (message, html) => {
        const itemUuid = message.getFlag("pbta", "itemUuid");
        if (!itemUuid) { return; }

        const resultRow = html.querySelector(".pbta-chat-card .row.result");
        if (!resultRow?.classList.contains("failure")) { return; }

        const item = await fromUuid(itemUuid);
        if (!item || !shouldOfferMarkPotential(item.name, true)) { return; }

        const actor = ChatMessage.getSpeakerActor(message.speaker);
        if (!actor?.isOwner) { return; }

        if (message.getFlag(MODULE_ID, "potentialMarked")) { return; }

        const xp = getPotentialAttribute(actor);
        if (!xp) { return; }

        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("masks-mark-potential");
        button.disabled = isPotentialFull(xp);
        button.innerHTML = `<i class="fa-solid fa-star"></i> ${game.i18n.localize("MASKS-SHEETS.Chat.MarkPotential")}`;

        button.addEventListener("click", async () => {
            button.disabled = true;
            await markPotential(actor);
            await message.setFlag(MODULE_ID, "potentialMarked", true);
        });

        resultRow.insertAdjacentElement("afterend", button);
    });
}
