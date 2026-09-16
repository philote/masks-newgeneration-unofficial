// Built lazily (called from initTeamPool() during the "init" hook) rather than
// referencing foundry.abstract/foundry.data.fields at module-import time —
// see the equivalent note in sheets/team-pool-sheet.mjs.
export function createTeamPoolDataModel() {
    return class TeamPoolDataModel extends foundry.abstract.TypeDataModel {
        static defineSchema() {
            const fields = foundry.data.fields;
            return {
                pool: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
            };
        }
    };
}
