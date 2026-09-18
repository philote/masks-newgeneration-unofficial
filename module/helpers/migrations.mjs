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

const DUPLICATE_CHOICE_LISTS = {
    "Are You Watching Closely?":
        "\n<ul>\n<li>you get an opportunity</li>\n<li>you expose a weakness or flaw</li>\n<li>you confuse them for some time</li>\n<li>you avoid further entanglement</li>\n</ul>",
    "Be The Monster":
        "\n<ul>\n<li>you frighten others you had not intended to scare</li>\n<li>you hurt someone or break something you shouldn&rsquo;t have</li>\n<li>you feel like more of a monster afterward; mark a condition (GM&rsquo;s choice)</li>\n</ul>",
    "Bull's Heart: Defender":
        "\n<ul>\n<li class=\"p1\">add a Team to the pool</li>\n<li class=\"p1\">take Influence over someone you protect</li>\n<li class=\"p1\">clear a condition</li>\n</ul>\n",
    "Fight the Good Fight":
        "\n<ul>\n<li class=\"p1\">resist or avoid their blows</li>\n<li class=\"p1\">take something from them</li>\n<li class=\"p1\">create an opportunity for your allies</li>\n<li class=\"p1\"><s>impress, surprise, or frighten the opposition</s></li>\n</ul>",
    "Not So Different After All":
        "\n<ul>\n<li>confess a flaw of your home; add 1 Team to the pool</li>\n<li>mislead them about your home; take Influence over them</li>\n<li>describe the glories of your home; clear a condition</li>\n</ul>",
    "Reality Storm (Flare)":
        "\n<ul>\n<li class=\"p1\">resist or avoid their blows</li>\n<li class=\"p1\">take something from them</li>\n<li class=\"p1\">create an opportunity for your allies</li>\n<li class=\"p1\">impress, surprise, or frighten the opposition</li>\n</ul>",
    "Shielding (Flare)":
        "\n<ul>\n<li class=\"p1\">add a Team to the pool</li>\n<li class=\"p1\">take Influence over someone you protect</li>\n<li class=\"p1\">clear a condition</li>\n</ul>\n",
    "Straight. Up. Creepinâ€™":
        "\n<ul>\n<li>what&rsquo;s my best way in/out?</li>\n<li>what happened here recently?</li>\n<li>what here is worth grabbing?</li>\n<li>who or what here is not what they seem?</li>\n<li>whose place is this?</li>\n</ul>",
    "Suck it, Domitian":
        "\n<ul>\n<li class=\"p1\">resist or avoid their blows</li>\n<li class=\"p1\">take something from them</li>\n<li class=\"p1\">create an opportunity for your allies</li>\n<li class=\"p1\">impress, surprise, or frighten the opposition</li>\n</ul>",
    "Symbol of Authority":
        "\n<ul>\n<li>do what you say</li>\n<li>get out of your way</li>\n<li>attack you at a disadvantage</li>\n<li>freeze</li>\n</ul>",
    "Venting Frustration":
        "\n<ul>\n<li class=\"p1\">resist or avoid their blows</li>\n<li class=\"p1\">take something from them</li>\n<li class=\"p1\">create an opportunity for your allies</li>\n<li class=\"p1\">impress, surprise, or frighten the opposition</li>\n</ul>"
};
/**
 * Fight the Good Fight forbids one of its options in its own description, which the prose list
 * conveyed by striking that line through. With the prose list gone the choices
 * list has to carry it instead, so the matching entry is struck there.
 */
const STRUCK_CHOICES = {
    "Fight the Good Fight": {
        from:
            "<h4>@UUID[Compendium.masks-newgeneration-unofficial.documents.JournalEntry.w5RMQhyRMu0Kz8Bh.JournalEntryPage.3e3Dyp1IAnqrGwNj]{Impress, surprise, or frighten the opposition}</h4>",
        to:
            "<h4><s>@UUID[Compendium.masks-newgeneration-unofficial.documents.JournalEntry.w5RMQhyRMu0Kz8Bh.JournalEntryPage.3e3Dyp1IAnqrGwNj]{Impress, surprise, or frighten the opposition}</s></h4>"
    }
};


/**
 * These moves used to repeat their choice list as plain prose inside each result,
 * so a chat card listed every option twice - once as text, once as the linked
 * choices. Actors keep the copy they were granted, so the stale list has to be
 * stripped from those too. Matched on the exact old list plus a choices list that
 * is still there, leaving a move whose prose a player rewrote alone (idempotent:
 * the fragment no longer matches once removed).
 */
export async function migrateDuplicateChoiceLists() {
    for (const actor of game.actors) {
        const updates = [];

        for (const item of actor.items) {
            if (item.type !== "move") { continue; }

            const staleList = DUPLICATE_CHOICE_LISTS[item.name];
            if (!staleList || !item.system?.choices?.trim()) { continue; }

            const update = { _id: item.id };
            for (const key of ["success", "partial"]) {
                const value = item.system.moveResults?.[key]?.value;
                if (!value?.includes(staleList)) { continue; }
                update[`system.moveResults.${key}.value`] = value.replace(staleList, "").trim();
            }

            const struckChoice = STRUCK_CHOICES[item.name];
            if (struckChoice && item.system.choices.includes(struckChoice.from)) {
                update["system.choices"] = item.system.choices.replace(struckChoice.from, struckChoice.to);
            }

            if (Object.keys(update).length > 1) { updates.push(update); }
        }

        if (updates.length) {
            await actor.updateEmbeddedDocuments("Item", updates);
            console.log(`masks-newgeneration-unofficial | Migrated duplicate choice lists on actor "${actor.name}".`);
        }
    }
}
