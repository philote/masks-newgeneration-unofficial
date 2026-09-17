/**
 * Existing actors already own their own copy of a move from whenever it was
 * granted/dragged on — updating the compendium source never touches items
 * actors already have. Patch those embedded copies directly so players don't
 * have to delete and re-add the move by hand. Matched by name + the old
 * rollType (idempotent: already-migrated or intentionally customized items
 * are left alone since they won't have rollType "prompt").
 */
async function migrateMoveRollType(moveName, { rollType, rollFormula }) {
    for (const actor of game.actors) {
        const updates = actor.items
            .filter((item) => item.type === "move" && item.name === moveName && item.system.rollType === "prompt")
            .map((item) => ({
                _id: item.id,
                "system.rollType": rollType,
                "system.rollFormula": rollFormula
            }));

        if (updates.length) {
            await actor.updateEmbeddedDocuments("Item", updates);
            console.log(`masks-newgeneration-unofficial | Migrated "${moveName}" on actor "${actor.name}".`);
        }
    }
}

export async function migrateTakeAPowerfulBlow() {
    await migrateMoveRollType("Take a Powerful Blow", { rollType: "formula", rollFormula: "2d6" });
}

export async function migrateRejectingInfluence() {
    await migrateMoveRollType("Rejecting Influence", { rollType: "formula", rollFormula: "2d6" });
}

export async function migrateBurn() {
    await migrateMoveRollType("Burn", { rollType: "formula", rollFormula: "2d6" });
}

export async function migrateWheneverTimePasses() {
    await migrateMoveRollType("Whenever time passes", { rollType: "savior", rollFormula: "" });
}

export async function migrateLegacy() {
    await migrateMoveRollType("Legacy", { rollType: "savior", rollFormula: "" });
}

const NO_POWERS_MOVE_NAME = "No Powers and Not Nearly Enough Training";
const NO_POWERS_BASIC_MOVE_CHOICES = [
    "Compendium.masks-newgeneration-unofficial.moves.Item.RbWTLi81e6IZ9vH4",
    "Compendium.masks-newgeneration-unofficial.moves.Item.6rnOFrthWetWrS7c",
    "Compendium.masks-newgeneration-unofficial.moves.Item.sog3ZBzKUOxRDHWw"
];

/**
 * "No Powers and Not Nearly Enough Training" gained a "basicMoveChoices" flag
 * that drives the basic-move roll picker (see basic-move-picker.mjs) after
 * many actors had already dragged their own copy onto their sheet — those
 * embedded copies never pick up new flags added to the compendium source on
 * their own. Matched by name + a missing flag (idempotent: already-migrated
 * or manually-customized items are left alone since they already have it).
 */
export async function migrateNoPowersBasicMoveChoices() {
    for (const actor of game.actors) {
        const updates = actor.items
            .filter(
                (item) =>
                    item.type === "move" &&
                    item.name === NO_POWERS_MOVE_NAME &&
                    !item.flags?.["masks-newgeneration-unofficial"]?.basicMoveChoices
            )
            .map((item) => ({
                _id: item.id,
                "flags.masks-newgeneration-unofficial.basicMoveChoices": NO_POWERS_BASIC_MOVE_CHOICES
            }));

        if (updates.length) {
            await actor.updateEmbeddedDocuments("Item", updates);
            console.log(`masks-newgeneration-unofficial | Migrated "${NO_POWERS_MOVE_NAME}" on actor "${actor.name}".`);
        }
    }
}

/**
 * Shared migration for moves that roll + a playbook-specific attribute Label
 * (see attribute-roll.mjs) — matched by name + the attribute key not already
 * matching (idempotent: already-migrated or manually-customized items are
 * left alone). Each playbook's move gets a thin exported wrapper below,
 * mirroring migrateMoveRollType()'s "generic function + per-move wrapper"
 * shape so wiring up the next one (Bull, Nova, ...) is a single line.
 */
async function migrateMoveAttributeRoll(moveName, attributeKey, resolver) {
    for (const actor of game.actors) {
        const updates = actor.items
            .filter((item) => {
                const flags = item.flags?.["masks-newgeneration-unofficial"];
                return item.type === "move" && item.name === moveName &&
                    (flags?.attributeRollKey !== attributeKey || (resolver && flags?.attributeRollResolver !== resolver));
            })
            .map((item) => {
                const update = {
                    _id: item.id,
                    "system.rollType": "formula",
                    "system.rollFormula": "2d6",
                    "flags.masks-newgeneration-unofficial.attributeRollKey": attributeKey
                };
                if (resolver) update["flags.masks-newgeneration-unofficial.attributeRollResolver"] = resolver;
                return update;
            });

        if (updates.length) {
            await actor.updateEmbeddedDocuments("Item", updates);
            console.log(`masks-newgeneration-unofficial | Migrated "${moveName}" on actor "${actor.name}".`);
        }
    }
}

export async function migrateAHigherCalling() {
    await migrateMoveAttributeRoll("A Higher Calling", "theSoldier");
}

export async function migrateFriendsInLowPlaces() {
    await migrateMoveAttributeRoll("Friends in Low Places", "theReformed", "highestCheckedCount");
}

const KIRBY_CRAFT_MOVE_NAME = "Kirby-Craft";
const KIRBY_CRAFT_BASIC_MOVE_CHOICES = [
    "Compendium.masks-newgeneration-unofficial.moves.Item.RbWTLi81e6IZ9vH4",
    "Compendium.masks-newgeneration-unofficial.moves.Item.6rnOFrthWetWrS7c",
    "Compendium.masks-newgeneration-unofficial.moves.Item.sog3ZBzKUOxRDHWw"
];

/**
 * "Kirby-Craft" gained the same "basicMoveChoices" picker as "No Powers and Not
 * Nearly Enough Training" (see basic-move-picker.mjs), plus a rollType of
 * "superior" (it was previously "", relying on pbta's fallback prompt) —
 * existing embedded copies need both patched in since compendium updates
 * don't touch items actors already dragged onto their sheet. Matched by name +
 * a missing flag (idempotent: already-migrated or manually-customized items
 * are left alone since they already have it).
 */
export async function migrateKirbyCraftBasicMoveChoices() {
    for (const actor of game.actors) {
        const updates = actor.items
            .filter(
                (item) =>
                    item.type === "move" &&
                    item.name === KIRBY_CRAFT_MOVE_NAME &&
                    !item.flags?.["masks-newgeneration-unofficial"]?.basicMoveChoices
            )
            .map((item) => ({
                _id: item.id,
                "system.rollType": "superior",
                "flags.masks-newgeneration-unofficial.basicMoveChoices": KIRBY_CRAFT_BASIC_MOVE_CHOICES
            }));

        if (updates.length) {
            await actor.updateEmbeddedDocuments("Item", updates);
            console.log(`masks-newgeneration-unofficial | Migrated "${KIRBY_CRAFT_MOVE_NAME}" on actor "${actor.name}".`);
        }
    }
}

/**
 * Shared migration for moves that gained a "rollOptions" array flag (see
 * roll-options.mjs), matched by name + a missing flag (idempotent:
 * already-migrated or manually-customized items are left alone).
 */
async function migrateMoveRollOptions(moveName, rollOptions) {
    for (const actor of game.actors) {
        const updates = actor.items
            .filter(
                (item) =>
                    item.type === "move" &&
                    item.name === moveName &&
                    !item.flags?.["masks-newgeneration-unofficial"]?.rollOptions
            )
            .map((item) => ({
                _id: item.id,
                "system.rollType": "ask",
                "flags.masks-newgeneration-unofficial.rollOptions": rollOptions
            }));

        if (updates.length) {
            await actor.updateEmbeddedDocuments("Item", updates);
            console.log(`masks-newgeneration-unofficial | Migrated "${moveName}" on actor "${actor.name}".`);
        }
    }
}

export async function migrateConnectingTheDots() {
    await migrateMoveRollOptions("Connecting the Dots", [
        {
            label: "Remember someone's future self",
            attributeRollKey: "theHarbingerMemories",
            moveResults: {
                success: {
                    key: "data.moveResults.success.value",
                    label: "Success!",
                    value: "<p>You connect who they are now to who they are in the future; choose the role that they fulfill in the future, and the GM will tell you about their future self. You can also ask a follow-up question.</p>"
                },
                partial: {
                    key: "data.moveResults.partial.value",
                    label: "Partial success",
                    value: "<p>You connect who they are now to who they are in the future; choose the role that they fulfill in the future, and the GM will tell you about their future self.</p>"
                },
                failure: {
                    key: "data.moveResults.failure.value",
                    label: "Complications...",
                    value: "<p>They're not at all who you thought they would be; the GM will choose their role, or tell you that as far as you know, they don't exist in the future.</p>"
                }
            }
        },
        {
            label: "Investigate the timeline",
            rollType: "savior",
            moveResults: {
                success: {
                    key: "data.moveResults.success.value",
                    label: "Success!",
                    value: "<p>Choose one figure noted above or one aspect of the future world you can remember. You've found a lead to follow to learn more about how the present version of that figure or aspect became the future version. The lead is particularly strong; right now, you can ask the GM one question about the figure or aspect, and they will answer honestly.</p>"
                },
                partial: {
                    key: "data.moveResults.partial.value",
                    label: "Partial success",
                    value: "<p>Choose one figure noted above or one aspect of the future world you can remember. You've found a lead to follow to learn more about how the present version of that figure or aspect became the future version.</p>"
                },
                failure: {
                    key: "data.moveResults.failure.value",
                    label: "Complications...",
                    value: "<p>You're lost in the present; the GM will tell you how things are so different here, and shift your Labels according to how it makes you feel.</p>"
                }
            }
        }
    ]);
}

export async function migrateAllTheBestStuff() {
    await migrateMoveRollOptions("All the Best Stuff", [
        { label: "A hero's cache", rollType: "savior" },
        { label: "A villain's cache", rollType: "danger" }
    ]);
}

const A_HIGHER_CALLING_LABEL_SWAP = {
    attributeKey: "theSoldier",
    moveTypes: ["basic", "playbook"],
    reminderText: "Give A.E.G.I.S. Influence over you."
};

export async function migrateAHigherCallingLabelSwap() {
    for (const actor of game.actors) {
        const updates = actor.items
            .filter(
                (item) =>
                    item.type === "move" &&
                    item.name === "A Higher Calling" &&
                    !item.flags?.["masks-newgeneration-unofficial"]?.labelSwap
            )
            .map((item) => ({
                _id: item.id,
                "flags.masks-newgeneration-unofficial.labelSwap": A_HIGHER_CALLING_LABEL_SWAP
            }));

        if (updates.length) {
            await actor.updateEmbeddedDocuments("Item", updates);
            console.log(`masks-newgeneration-unofficial | Migrated "A Higher Calling" labelSwap on actor "${actor.name}".`);
        }
    }
}
