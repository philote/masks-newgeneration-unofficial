// Built lazily (called from initTeamPool() during the "init" hook) rather than
// referencing foundry.abstract/foundry.data.fields at module-import time —
// see the equivalent note in sheets/team-pool-sheet.mjs.
export function createTeamPoolDataModel() {
    return class TeamPoolDataModel extends foundry.abstract.TypeDataModel {
        static defineSchema() {
            const fields = foundry.data.fields;
            return {
                pool: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
                // pbta's own ActorPbta.conditionGroups getter (system code, not this
                // module's) does Object.entries(this.system.attributes) unconditionally
                // for every actor, including when Foundry's core ChatMessage pipeline
                // calls getRollData() on a speaker actor (any ChatMessage.create with a
                // speaker, not just an actual roll). Without this field, system.attributes
                // is undefined and that throws.
                attributes: new fields.ObjectField({ initial: {} }),
            };
        }
    };
}
