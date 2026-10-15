const MODULE_ID = "masks-newgeneration-unofficial";

export const MOVE_HOLD_STEPPER_FLAG = "holdStepper";
export const MOVE_HOLD_VALUE_FLAG = "hold";

/**
 * Moves whose text grants hold (e.g. Burn's "Hold 3 burn") carry a
 * `holdStepper` flag, which shows a per-move Hold stepper on the character
 * sheet; the current count is stored on the same embedded move as `hold`.
 */
export function moveHasHoldStepper(item) {
    return item?.flags?.[MODULE_ID]?.[MOVE_HOLD_STEPPER_FLAG] === true;
}

function toHoldValue(raw) {
    const value = Math.trunc(Number(raw));
    return Number.isFinite(value) && value > 0 ? value : 0;
}

export function moveHoldValue(item) {
    return toHoldValue(item?.flags?.[MODULE_ID]?.[MOVE_HOLD_VALUE_FLAG]);
}

export function nextHoldValue(current, action) {
    const value = toHoldValue(current);
    if (action === "increase") return value + 1;
    if (action === "decrease") return Math.max(0, value - 1);
    return value;
}

async function writeHold(item, next) {
    if (!item || next === moveHoldValue(item)) return;
    await item.setFlag(MODULE_ID, MOVE_HOLD_VALUE_FLAG, next);
}

export async function adjustMoveHold(item, action) {
    await writeHold(item, nextHoldValue(moveHoldValue(item), action));
}

export async function setMoveHold(item, rawValue) {
    await writeHold(item, toHoldValue(rawValue));
}
