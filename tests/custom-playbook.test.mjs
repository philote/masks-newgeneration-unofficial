import { beforeEach, describe, expect, it, vi } from "vitest";
import playbookData from "../src/packs/custom-playbook/playbook_Custom_lpBBC1uT1iFGbwXs.json";
import beaconData from "../src/packs/basic-playbook-beacon/playbook_The_Beacon_0iryK44tVpbXhlMF.json";
import {
	ALLOW_CUSTOM_PLAYBOOKS_SETTING,
	filterPlaybookChoices,
	isCustomPlaybookUuid,
	registerCustomPlaybookSetting
} from "../module/helpers/custom-playbook.mjs";

const CUSTOM_UUID = "Compendium.masks-newgeneration-unofficial.custom-playbook.Item.lpBBC1uT1iFGbwXs";
const BEACON_UUID = "Compendium.masks-newgeneration-unofficial.basic-playbook-beacon.Item.0iryK44tVpbXhlMF";

function stubSetting(allowed) {
	vi.stubGlobal("game", { settings: { get: vi.fn().mockReturnValue(allowed), register: vi.fn() } });
}

describe("isCustomPlaybookUuid", () => {
	it("matches any document in the custom playbook pack", () => {
		expect(isCustomPlaybookUuid(CUSTOM_UUID)).toBe(true);
	});

	it("rejects other packs, world items, and missing uuids", () => {
		expect(isCustomPlaybookUuid(BEACON_UUID)).toBe(false);
		expect(isCustomPlaybookUuid("Item.lpBBC1uT1iFGbwXs")).toBe(false);
		expect(isCustomPlaybookUuid(undefined)).toBe(false);
	});
});

describe("filterPlaybookChoices", () => {
	const playbooks = [
		{ name: "Custom", uuid: CUSTOM_UUID },
		{ name: "The Beacon", uuid: BEACON_UUID }
	];

	it("leaves the list alone when custom playbooks are allowed", () => {
		stubSetting(true);

		expect(filterPlaybookChoices(playbooks, undefined)).toEqual(playbooks);
	});

	it("drops the Custom playbook when custom playbooks aren't allowed", () => {
		stubSetting(false);

		expect(filterPlaybookChoices(playbooks, BEACON_UUID)).toEqual([{ name: "The Beacon", uuid: BEACON_UUID }]);
		expect(game.settings.get).toHaveBeenCalledWith("masks-newgeneration-unofficial", ALLOW_CUSTOM_PLAYBOOKS_SETTING);
	});

	it("keeps the Custom playbook for an actor already using it", () => {
		stubSetting(false);

		expect(filterPlaybookChoices(playbooks, CUSTOM_UUID)).toEqual(playbooks);
	});
});

describe("registerCustomPlaybookSetting", () => {
	beforeEach(() => {
		stubSetting(false);
		registerCustomPlaybookSetting();
	});

	it("registers an off-by-default world setting shown in the config menu", () => {
		expect(game.settings.register).toHaveBeenCalledWith(
			"masks-newgeneration-unofficial",
			ALLOW_CUSTOM_PLAYBOOKS_SETTING,
			expect.objectContaining({ scope: "world", config: true, type: Boolean, default: false })
		);
	});

	it("re-renders only open character sheets when changed", () => {
		const characterSheet = { actor: { type: "character" }, render: vi.fn() };
		const npcSheet = { actor: { type: "npc" }, render: vi.fn() };
		const otherWindow = { render: vi.fn() };
		vi.stubGlobal("ui", { windows: { 1: characterSheet, 2: npcSheet, 3: otherWindow } });

		const { onChange } = game.settings.register.mock.calls[0][2];
		onChange(true);

		expect(characterSheet.render).toHaveBeenCalledWith(false);
		expect(npcSheet.render).not.toHaveBeenCalled();
		expect(otherWindow.render).not.toHaveBeenCalled();
	});
});

describe("Custom playbook data", () => {
	it("is a character playbook with the custom slug", () => {
		expect(playbookData.type).toBe("playbook");
		expect(playbookData.system.slug).toBe("custom");
		expect(playbookData.system.actorType).toBe("character");
	});

	it("starts every Label at 0", () => {
		const values = Object.values(playbookData.system.stats).map((stat) => stat.value);
		expect(values).toHaveLength(5);
		expect(values.every((value) => value === 0)).toBe(true);
	});

	it("grants no moves and pre-fills no details", () => {
		const { advancements, laterAdvances, ...details } = playbookData.system.attributes;
		expect(playbookData.system.choiceSets).toEqual([]);
		for (const attribute of Object.values(details)) {
			expect(attribute.choices).toEqual([]);
			expect(attribute.custom).toBe(false);
		}
	});

	it("has eight blank, player-editable advancements", () => {
		const [choice] = playbookData.system.attributes.advancements.choices;
		const options = Object.values(choice.options);
		expect(options).toHaveLength(8);
		expect(options.every((option) => option.label === "[Text]" && option.value === false)).toBe(true);
	});

	it("has the core book's standard later advances", () => {
		const labelsOf = (data) => Object.values(data.system.attributes.laterAdvances.choices[0].options).map((o) => o.label);
		expect(labelsOf(playbookData)).toEqual(labelsOf(beaconData));
	});
});
