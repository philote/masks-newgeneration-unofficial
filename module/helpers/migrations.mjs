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
