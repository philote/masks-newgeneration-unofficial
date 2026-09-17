/**
 * Every move a currently-marked condition can penalize, and which one.
 * Read by module/helpers/basic-move-conditions.mjs (forces + locks the
 * applicable condition, strips the rest) and module/helpers/powerful-blow.mjs
 * (the ALL_CONDITIONS_MOVE_NAMES exemption below). A move's absence here
 * means no condition penalizes it, so its roll dialog shows no conditions
 * cell at all — see basic-move-conditions.mjs for that default.
 *
 * Keys must match a move item's `name` field exactly (including any
 * typographic punctuation the pack JSON uses) since matching is against the
 * roll dialog's title, which embeds the raw name.
 */
export const MOVE_CONDITIONS = {
    // The 8 core rollable basic/peripheral moves.
    "Comfort or Support": "Angry",
    "Provoke Someone": "Guilty",
    "Assess the Situation": "Guilty",
    "Directly Engage a Threat": "Afraid",
    "Unleash Your Powers": "Hopeless",
    "Defend": "Insecure",
    "Pierce the Mask": "Angry",
    "Rejecting Influence": "Insecure",

    // Playbook moves that are alternate ways of making Directly Engage a
    // Threat (roll a different Label, but it's still that move).
    "More Than A Shield": "Afraid",
    "Suck it, Domitian": "Afraid",
    "Fight the Good Fight": "Afraid",
    "Reality Storm (Flare)": "Afraid",
    "Venting Frustration": "Afraid",
    "Going Solo (Distinction)": "Afraid",
    "Stage-Fighting": "Afraid",
    "The Littlest Space Bandit": "Afraid",

    // Alternate ways of making Comfort or Support, plus Pierce the Mask's
    // one wrapper (Applied History) — both are penalized by Angry.
    "Logical Angle": "Angry",
    "The Best of Them": "Angry",
    "Heroic Tradition": "Angry",
    "Wish I Could Be": "Angry",
    "Thermodynamic Miracle": "Angry",
    "Take It From Me": "Angry",
    "Tomorrow’s Golden Promise": "Angry",
    "White Lies": "Angry",
    "Applied History": "Angry",

    // Alternate ways of making Provoke Someone.
    "Bull's Heart: Enabler": "Guilty",
    "You’ve Got a Head You Don’t Need": "Guilty",
    "White Knight": "Guilty",
    "Not So Different": "Guilty",

    // Alternate ways of making Unleash Your Powers.
    "Physics? What Physics?": "Hopeless",
    "Growing Into Power": "Hopeless",
    "I Learned the Solution in Grade School": "Hopeless",

    // Alternate ways of making Defend, plus Rejecting Influence's one
    // wrapper (See It Their Way) — both are penalized by Insecure.
    "Bull's Heart: Defender": "Insecure",
    "Shielding (Flare)": "Insecure",
    "See It Their Way": "Insecure"
};

/**
 * Moves that apply every currently-marked condition as a flat bonus rather
 * than letting the player opt into the one condition the rules call for
 * (see powerful-blow.mjs — the name predates "Burn" joining it, but the
 * mechanic is identical: "roll + conditions you currently have marked").
 * basic-move-conditions.mjs must leave these dialogs alone instead of
 * removing the cell powerful-blow.mjs just configured — both hooks fire on
 * the same "renderDialog" event.
 */
export const ALL_CONDITIONS_MOVE_NAMES = ["Take a Powerful Blow", "Burn"];

/**
 * Maps each MOVE_CONDITIONS value to its option index under
 * MASKS-SHEETS.CharacterSheets.conditions.options in languages/*.json (see
 * config-sheet.mjs, which builds the sheet-config condition checkboxes from
 * those same five keys in the same order). basic-move-conditions.mjs reads
 * this to localize the condition name it's matching against, since the
 * checkbox's rendered label is never in English once a non-English locale is
 * active.
 */
export const CONDITION_OPTION_KEYS = {
    Afraid: "0",
    Angry: "1",
    Guilty: "2",
    Hopeless: "3",
    Insecure: "4"
};
