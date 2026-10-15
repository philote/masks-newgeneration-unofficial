import {
    MODULE_ID,
    applyRollBonus,
    availableBonuses,
    findLatestRoll,
    isBonusRollMessage,
    nextBonusState
} from "./roll-bonuses-utils.mjs";

const ICONS = {
    forward: "fa-forward",
    ongoing: "fa-infinity",
    influence: "fa-handshake",
    exploit: "fa-hand-fist"
};

/**
 * Replaces pbta's preroll forward/ongoing dialog (suppressed in
 * skip-empty-roll-dialog.mjs) with buttons on the posted roll card: Use Forward,
 * Use Ongoing, Use Influence, and Exploit Influence once Influence is used.
 * Offered only on the rolling actor's most recent roll card, and only to that
 * actor's owner when they can also update the message (its author, or the GM).
 */
export function initRollBonuses() {
    Hooks.on("renderChatMessageHTML", renderRollBonuses);

    Hooks.on("createChatMessage", (message) => {
        if (!isBonusRollMessage(message)) return;
        const previous = findLatestRoll(game.messages.contents, message.speaker?.actor, message.id);
        if (previous) ui.chat?.updateMessage?.(previous);
    });
}

export function renderRollBonuses(message, html) {
    if (!isBonusRollMessage(message)) return;

    const actor = ChatMessage.getSpeakerActor(message.speaker);
    if (actor?.type !== "character" || !actor.isOwner || !message.isOwner) return;
    if (findLatestRoll(game.messages.contents, actor.id)?.id !== message.id) return;

    const diceRoll = html.querySelector(".pbta-chat-card .dice-roll");
    if (!diceRoll) return;

    const bonuses = availableBonuses(actor, bonusState(message));
    if (!bonuses.length) return;

    const container = document.createElement("div");
    container.classList.add("masks-roll-bonuses");
    for (const bonus of bonuses) {
        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("masks-roll-bonus");
        button.dataset.bonus = bonus.action;
        button.innerHTML = `<i class="fa-solid ${ICONS[bonus.action]}"></i> ${buttonLabel(bonus)}`;
        button.addEventListener("click", async () => {
            button.disabled = true;
            await useRollBonus(message, actor, bonus);
        });
        container.append(button);
    }

    diceRoll.insertAdjacentElement("afterend", container);
}

export async function useRollBonus(message, actor, bonus) {
    if (findLatestRoll(game.messages.contents, actor.id)?.id !== message.id) {
        ui.notifications.warn(game.i18n.localize("MASKS-SHEETS.Chat.NotLatestRoll"));
        return ui.chat?.updateMessage?.(message);
    }

    const state = bonusState(message);
    const current = availableBonuses(actor, state)
        .find((b) => b.action === bonus.action && b.influenceId === bonus.influenceId);
    if (!current) {
        ui.notifications.warn(game.i18n.localize("MASKS-SHEETS.Chat.BonusUnavailable"));
        return ui.chat?.updateMessage?.(message);
    }

    try {
        if (current.action === "forward") {
            const forward = Number(actor.system.resources.forward.value) || 0;
            await actor.update({ "system.resources.forward.value": Math.max(0, forward - 1) });
        }

        const rolls = message.rolls;
        await applyRollBonus(rolls[0], current.amount, conditionLabel(current));
        await message.update({
            rolls,
            [`flags.${MODULE_ID}.rollBonuses`]: nextBonusState(state, current)
        });

        if (current.action === "exploit") {
            await ChatMessage.create({
                user: game.user.id,
                content: game.i18n.format("MASKS-SHEETS.Chat.ExploitedInfluence", {
                    actor: actor.name,
                    target: influenceName(current)
                }),
                speaker: ChatMessage.getSpeaker({ actor })
            });
        }
    } catch (err) {
        console.error(`${MODULE_ID} | Error applying roll bonus:`, err);
    }
}

function bonusState(message) {
    return message.getFlag(MODULE_ID, "rollBonuses") ?? {};
}

function influenceName(bonus) {
    return bonus.name || game.i18n.localize("MASKS-SHEETS.Chat.InfluenceUnnamed");
}

function buttonLabel(bonus) {
    switch (bonus.action) {
        case "forward":
            return game.i18n.localize("MASKS-SHEETS.Chat.UseForward");
        case "ongoing":
            return game.i18n.localize("MASKS-SHEETS.Chat.UseOngoing");
        case "influence":
            return game.i18n.format("MASKS-SHEETS.Chat.UseInfluence", { name: influenceName(bonus) });
        case "exploit":
            return game.i18n.format("MASKS-SHEETS.Chat.ExploitInfluence", { name: influenceName(bonus) });
    }
}

function conditionLabel(bonus) {
    switch (bonus.action) {
        case "forward":
            return `${game.i18n.localize("PBTA.Forward")} (+1)`;
        case "ongoing":
            return `${game.i18n.localize("PBTA.Ongoing")} (+1)`;
        case "influence":
            return game.i18n.format("MASKS-SHEETS.Chat.InfluenceCondition", { name: influenceName(bonus) });
        case "exploit":
            return game.i18n.format("MASKS-SHEETS.Chat.ExploitCondition", { name: influenceName(bonus) });
    }
}
