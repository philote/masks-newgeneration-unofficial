export const TEAM_ACTOR_TYPE = "masks-newgeneration-unofficial.team";

export const TEAM_POOL_TOKEN_IMAGE_SETTING = "team_pool_token_image";

// "%23" rather than "#": a literal "#" in a texture path is read as a URL
// fragment. Matches how the compendium packs reference these same game-icons.
export const DEFAULT_TEAM_POOL_TOKEN_IMAGE = "modules/masks-newgeneration-unofficial/images/gameicons/three-friends-%23ffffff-%233da7db.svg";

export function resolveTeamPoolTokenImage(settingValue) {
    const trimmed = (settingValue ?? "").trim();
    return trimmed || DEFAULT_TEAM_POOL_TOKEN_IMAGE;
}

const NAME_SUFFIX_PATTERN = / \(\d+\)$/;

export function baseTeamPoolName(name) {
    return name.replace(NAME_SUFFIX_PATTERN, "");
}

export function formatTeamPoolName(name, pool) {
    return `${baseTeamPoolName(name)} (${pool})`;
}

export async function adjustTeamPool(actor, delta) {
    const next = Math.max(0, actor.system.pool + delta);
    return actor.update({ "system.pool": next });
}

export async function postTeamPoolToChat(actor) {
    return ChatMessage.create({
        user: game.user.id,
        content: game.i18n.format("MASKS-SHEETS.Chat.TeamPool", { value: actor.system.pool }),
        speaker: ChatMessage.getSpeaker({ actor }),
    });
}
