export const TEAM_ACTOR_TYPE = "masks-newgeneration-unofficial.team";

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
