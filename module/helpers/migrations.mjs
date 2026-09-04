const MOVE_NAME = "Take a Powerful Blow";

/**
 * Existing actors already own their own copy of "Take a Powerful Blow" from
 * whenever it was granted/dragged on — updating the compendium source never
 * touches items actors already have. Patch those embedded copies directly so
 * players don't have to delete and re-add the move by hand. Matched by name
 * + the old rollType (idempotent: already-migrated or intentionally
 * customized items are left alone since they won't have rollType "prompt").
 */
export async function migrateTakeAPowerfulBlow() {
    for (const actor of game.actors) {
        const updates = actor.items
            .filter((item) => item.type === "move" && item.name === MOVE_NAME && item.system.rollType === "prompt")
            .map((item) => ({
                _id: item.id,
                "system.rollType": "formula",
                "system.rollFormula": "2d6"
            }));

        if (updates.length) {
            await actor.updateEmbeddedDocuments("Item", updates);
            console.log(`masks-newgeneration-unofficial | Migrated "${MOVE_NAME}" on actor "${actor.name}".`);
        }
    }
}
