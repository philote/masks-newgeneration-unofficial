/**
 * The 5 core-book "adult moves" (Masks: A New Generation), used by the move
 * picker (module/helpers/move-picker.mjs) to find and offer them. None of
 * these moves are penalized by conditions, but that no longer needs listing
 * here — module/helpers/basic-move-conditions.mjs hides the conditions cell
 * for any move absent from module/helpers/move-condition-map.mjs, which
 * covers these 5 by omission along with every other non-penalized move.
 */
export const CANONICAL_ADULT_MOVE_NAMES = [
    "Wield Your Powers",
    "Overwhelm a Vulnerable Foe",
    "Persuade With Best Interests",
    "Empathize",
    "Stand Up For Something"
];
