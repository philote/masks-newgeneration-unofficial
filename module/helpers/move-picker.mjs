/**
 * The pbta system's default "+" button on a move section just creates a
 * blank move Item the user has to hand-fill. This lets the Playbook Moves
 * and Adult Moves sections offer a picker instead: existing moves from the
 * character's own playbook, from another playbook, or (Playbook Moves only)
 * the fixed pool of 5 core-book adult moves. The section-header buttons for
 * these two sections are rendered with class "masks-move-picker" instead of
 * pbta's own "item-create" (see templates/parts/actor-movelist.hbs), so
 * pbta's default handler never sees them.
 */

import { CANONICAL_ADULT_MOVE_NAMES } from "./adult-moves.mjs";

const MODULE_ID = "masks-newgeneration-unofficial";

const PLAYBOOK_PACK_EXCLUSIONS = ["moves", "documents"];

export function initMovePicker() {
    Hooks.on("renderActorSheet", onRenderActorSheet);
}

function onRenderActorSheet(app, html) {
    if (app.actor.type !== "character") return;
    const root = html[0];

    const playbookButton = root.querySelector('.masks-move-picker[data-move-type="playbook"]');
    playbookButton?.addEventListener(
        "click",
        (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            openPlaybookChoiceDialog(app.actor);
        },
        { capture: true }
    );

    const adultButton = root.querySelector('.masks-move-picker[data-move-type="adult"]');
    adultButton?.addEventListener(
        "click",
        (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            openAdultMovePicker(app.actor);
        },
        { capture: true }
    );
}

async function openAdultMovePicker(actor) {
    const moves = excludeAlreadyOwned(actor, await listAdultMoves());
    if (!moves.length) {
        ui.notifications.warn(game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.NoMovesAvailable"));
        return;
    }
    await openMoveListDialog(actor, moves, game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.AdultMoveTitle"));
}

async function openPlaybookChoiceDialog(actor) {
    const hasPlaybook = Boolean(getActorPlaybookItem(actor));

    const buttons = [];
    if (hasPlaybook) {
        buttons.push({
            action: "own",
            label: game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.OwnPlaybook"),
            class: "dialog-button"
        });
    }
    buttons.push({
        action: "other",
        label: game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.OtherPlaybook"),
        class: "dialog-button"
    });
    buttons.push({
        action: "blank",
        label: game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.Blank"),
        class: "dialog-button"
    });

    const content = hasPlaybook
        ? `<div class="masks-move-picker-dialog"><p>${game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.PlaybookChoicePrompt")}</p></div>`
        : `<div class="masks-move-picker-dialog">` +
          `<p>${game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.PlaybookChoicePrompt")}</p>` +
          `<p class="notes">${game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.NoPlaybook")}</p></div>`;

    const choice = await foundry.applications.api.DialogV2.wait({
        window: { title: game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.PlaybookChoiceTitle") },
        classes: ["themed", "theme-light"],
        content,
        buttons,
        rejectClose: false
    });

    if (choice === "own") return openOwnPlaybookPicker(actor);
    if (choice === "other") return openOtherPlaybookPicker(actor);
    if (choice === "blank") return createBlankMove(actor);
}

async function openOwnPlaybookPicker(actor) {
    const packId = resolveOwnPlaybookPackName(actor);
    if (!packId) {
        ui.notifications.warn(game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.NoPlaybook"));
        return;
    }

    const moves = excludeAlreadyOwned(actor, await listPlaybookMoves(packId));
    if (!moves.length) {
        ui.notifications.warn(game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.NoMovesAvailable"));
        return;
    }
    await openMoveListDialog(actor, moves, game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.SelectMoveTitle"));
}

async function openOtherPlaybookPicker(actor) {
    const packs = listPlaybookPacks();
    const options = packs.map((pack) => `<option value="${pack.metadata.id}">${pack.metadata.label}</option>`).join("");

    const content = `
        <div class="masks-move-picker-dialog">
            <p>${game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.SelectPlaybookPrompt")}</p>
            <select name="pack">${options}</select>
        </div>
    `;

    const packId = await foundry.applications.api.DialogV2.wait({
        window: { title: game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.SelectPlaybookTitle") },
        classes: ["themed", "theme-light"],
        content,
        buttons: [
            {
                action: "next",
                label: game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.Next"),
                class: "dialog-button",
                default: true,
                callback: (event, button) => button.form.elements.pack.value
            }
        ],
        rejectClose: false
    });

    if (!packId) return;

    const moves = excludeAlreadyOwned(actor, await listPlaybookMoves(packId));
    if (!moves.length) {
        ui.notifications.warn(game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.NoMovesAvailable"));
        return;
    }
    await openMoveListDialog(actor, moves, game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.SelectMoveTitle"));
}

async function openMoveListDialog(actor, moves, title) {
    const options = moves
        .map(
            (move, index) => `
                <label class="masks-move-picker-option">
                    <input type="radio" name="uuid" value="${move.uuid}" ${index === 0 ? "checked" : ""}>
                    <span class="masks-move-picker-option-name">${move.name}</span>
                    <div class="masks-move-picker-option-description">${move.description ?? ""}</div>
                    ${renderMoveResultsHtml(move.moveResults)}
                </label>
            `
        )
        .join("");

    const uuid = await foundry.applications.api.DialogV2.wait({
        window: { title },
        classes: ["themed", "theme-light"],
        content: `<div class="masks-move-picker-dialog masks-move-picker-list">${options}</div>`,
        buttons: [
            {
                action: "add",
                label: game.i18n.localize("MASKS-SHEETS.Dialog.MovePicker.Add"),
                class: "dialog-button",
                default: true,
                callback: (event, button) => button.form.elements.uuid.value
            }
        ],
        rejectClose: false
    });

    if (!uuid) return;
    await addMoveToActor(actor, uuid);
}

export function getActorPlaybookItem(actor) {
    return actor.items.find((item) => item.type === "playbook");
}

export function resolveOwnPlaybookPackName(actor) {
    const sourceId = getActorPlaybookItem(actor)?.flags?.core?.sourceId;
    if (!sourceId) return null;
    const parsed = foundry.utils.parseUuid(sourceId);
    return parsed?.collection?.metadata?.id ?? null;
}

export function listPlaybookPacks() {
    return game.packs.filter(
        (pack) =>
            pack.metadata.system === "pbta" &&
            pack.metadata.type === "Item" &&
            !PLAYBOOK_PACK_EXCLUSIONS.includes(pack.metadata.name)
    );
}

export async function listPlaybookMoves(packId) {
    const pack = game.packs.get(packId);
    if (!pack) return [];
    const documents = await pack.getDocuments({ type: "move" });
    return Promise.all(documents.filter((doc) => doc.system.moveType === "playbook").map(toMoveOption));
}

export async function listAdultMoves() {
    const pack = game.packs.get(`${MODULE_ID}.moves`);
    if (!pack) return [];
    const documents = await pack.getDocuments({ type: "move" });
    return Promise.all(
        documents
            .filter((doc) => doc.system.moveType === "adult" && CANONICAL_ADULT_MOVE_NAMES.includes(doc.name))
            .map(toMoveOption)
    );
}

export function excludeAlreadyOwned(actor, moves) {
    const ownedNames = new Set(actor.items.filter((item) => item.type === "move").map((item) => item.name));
    return moves.filter((move) => !ownedNames.has(move.name));
}

export async function addMoveToActor(actor, uuid) {
    const source = await fromUuid(uuid);
    if (!source) return;
    await actor.createEmbeddedDocuments("Item", [source.toObject()]);
}

async function createBlankMove(actor) {
    await actor.createEmbeddedDocuments("Item", [{ name: "New Move", type: "move", system: { moveType: "playbook" } }]);
}

async function toMoveOption(doc) {
    return {
        uuid: doc.uuid,
        name: doc.name,
        description: await enrichMoveText(doc, doc.system.description),
        moveResults: await enrichMoveResults(doc, doc.system.moveResults),
        img: doc.img
    };
}

// Move description/moveResults text can contain @UUID[...]{Label} links to
// other moves (e.g. a vehicle move pointing at the moves it lets you use).
// Those are inert markup until enriched — pbta's own actor-sheet rendering
// enriches this same text before display, but this module's own picker
// dialog builds its preview HTML straight from the raw compendium document,
// so it has to enrich here too or the raw @UUID syntax leaks into the UI.
async function enrichMoveText(doc, text) {
    if (!text) return text;
    return foundry.applications.ux.TextEditor.implementation.enrichHTML(text, {
        relativeTo: doc,
        rollData: doc.getRollData?.() ?? {}
    });
}

async function enrichMoveResults(doc, moveResults) {
    if (!moveResults) return moveResults;
    const enriched = {};
    for (const [key, result] of Object.entries(moveResults)) {
        enriched[key] = result?.value ? { ...result, value: await enrichMoveText(doc, result.value) } : result;
    }
    return enriched;
}

// Only the roll trigger sentence lives in system.description — the "on a
// hit" text and its choice lists live in system.moveResults, keyed by
// success/partial/failure. Render whichever of those actually have text so
// the picker shows the move's full rules text, not just its trigger line.
function renderMoveResultsHtml(moveResults) {
    if (!moveResults) return "";
    return ["success", "partial", "failure"]
        .map((key) => moveResults[key])
        .filter((result) => result?.value)
        .map(
            (result) =>
                `<div class="masks-move-picker-option-result"><strong>${result.label}</strong> ${result.value}</div>`
        )
        .join("");
}
