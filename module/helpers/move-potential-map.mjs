/**
 * Every move whose failure result explicitly tells the player to mark
 * Potential. Read by module/helpers/mark-potential.mjs to decide whether a
 * "Mark Potential" button should appear on a failed roll's chat card.
 *
 * Built by scanning every move/npcMove item under src/packs/** for a
 * system.moveResults.failure.value that mentions "potential", then reading
 * each match's full failure text to rule out false positives. Matching is
 * against the rolled Item's own `name` field (resolved from the chat
 * message's `flags.pbta.itemUuid`, not a dialog title), so entries must
 * match that field exactly, including typographic punctuation the pack
 * JSON uses (e.g. curly apostrophes) — same convention as MOVE_CONDITIONS
 * in move-condition-map.mjs.
 *
 * This list needs a manual update if a future move (new compendium entry
 * or homebrew) is added whose failure result should also mark Potential.
 */
export const MOVES_THAT_MARK_POTENTIAL_ON_FAILURE = new Set([
    // Core basic moves.
    "Assess the Situation",
    "Comfort or Support",
    "Defend",
    "Directly Engage a Threat",
    "Empathize",
    "Overwhelm a Vulnerable Foe",
    "Persuade With Best Interests",
    "Pierce the Mask",
    "Provoke Someone",
    "Stand Up For Something",
    "Take a Powerful Blow",
    "Unleash Your Powers",
    "Wield Your Powers",

    // Playbook moves that are alternate ways of making a basic move, or
    // otherwise carry their own "Mark Potential" failure text.
    "Logical Angle",
    "More Than A Shield",
    "Suck it, Domitian",
    "Bull's Heart: Defender",
    "Bull's Heart: Enabler",
    "Physics? What Physics?",
    "You’ve Got a Head You Don’t Need",
    "Fight the Good Fight",
    "Reality Storm (Flare)",
    "Shielding (Flare)",
    "The Best of Them",
    "Heroic Tradition",
    "Venting Frustration",
    "Wish I Could Be",
    "Growing Into Power",
    "White Knight",
    "Going Solo (Distinction)",
    "Thermodynamic Miracle",
    "Not So Different",
    "Stage-Fighting",
    "Take It From Me",
    "Applied History",
    "I Learned the Solution in Grade School",
    "Tomorrow’s Golden Promise",
    "The Littlest Space Bandit",
    "White Lies",
]);
