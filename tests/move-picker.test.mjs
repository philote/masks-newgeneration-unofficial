import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	initMovePicker,
	getActorPlaybookItem,
	resolveOwnPlaybookPackName,
	listPlaybookPacks,
	listPlaybookMoves,
	listAdultMoves,
	excludeAlreadyOwned,
	addMoveToActor
} from "../module/helpers/move-picker.mjs";

function buildActor(items) {
	return {
		type: "character",
		items,
		createEmbeddedDocuments: vi.fn().mockResolvedValue(undefined)
	};
}

function buildMoveDoc({ uuid, name, moveType, description = "", moveResults, img = "icon.svg" }) {
	return { uuid, name, system: { moveType, description, moveResults }, img };
}

function buildPack({ id, name, label = name, system = "pbta", type = "Item", documents = [] }) {
	return {
		metadata: { id, name, label, system, type },
		getDocuments: vi.fn().mockResolvedValue(documents)
	};
}

function buildPacksCollection(packs) {
	const collection = [...packs];
	collection.get = (id) => packs.find((pack) => pack.metadata.id === id);
	return collection;
}

// Stands in for Foundry's TextEditor.enrichHTML, echoing input wrapped in a
// marker so tests can distinguish "enriched" output from raw input without
// depending on real @UUID-link resolution.
function stubTextEditorEnrichment() {
	const enrichHTML = vi.fn((text) => Promise.resolve(`[enriched]${text}[/enriched]`));
	vi.stubGlobal("foundry", { applications: { ux: { TextEditor: { implementation: { enrichHTML } } } } });
	return enrichHTML;
}

describe("getActorPlaybookItem", () => {
	it("finds the actor's playbook item", () => {
		const playbookItem = { type: "playbook", name: "The Beacon" };
		const actor = buildActor([{ type: "move", name: "Drives" }, playbookItem]);

		expect(getActorPlaybookItem(actor)).toBe(playbookItem);
	});

	it("returns undefined when the actor has no playbook item", () => {
		const actor = buildActor([{ type: "move", name: "Drives" }]);

		expect(getActorPlaybookItem(actor)).toBeUndefined();
	});
});

describe("resolveOwnPlaybookPackName", () => {
	it("returns null when the actor has no playbook item", () => {
		const actor = buildActor([]);

		expect(resolveOwnPlaybookPackName(actor)).toBeNull();
	});

	it("returns null when the playbook item has no sourceId flag", () => {
		const actor = buildActor([{ type: "playbook", name: "The Beacon", flags: {} }]);

		expect(resolveOwnPlaybookPackName(actor)).toBeNull();
	});

	it("resolves the compendium pack id from the playbook item's sourceId", () => {
		const sourceId = "Compendium.masks-newgeneration-unofficial.basic-playbook-beacon.Item.0iryK44tVpbXhlMF";
		const actor = buildActor([
			{ type: "playbook", name: "The Beacon", flags: { core: { sourceId } } }
		]);
		const parseUuid = vi.fn().mockReturnValue({
			collection: { metadata: { id: "masks-newgeneration-unofficial.basic-playbook-beacon" } }
		});
		vi.stubGlobal("foundry", { utils: { parseUuid } });

		expect(resolveOwnPlaybookPackName(actor)).toBe("masks-newgeneration-unofficial.basic-playbook-beacon");
		expect(parseUuid).toHaveBeenCalledWith(sourceId);
	});
});

describe("listPlaybookPacks", () => {
	it("returns only Item packs from the pbta system, excluding the shared moves/documents packs", () => {
		const beacon = buildPack({ id: "masks-newgeneration-unofficial.basic-playbook-beacon", name: "basic-playbook-beacon" });
		const bull = buildPack({ id: "masks-newgeneration-unofficial.basic-playbook-bull", name: "basic-playbook-bull" });
		const moves = buildPack({ id: "masks-newgeneration-unofficial.moves", name: "moves" });
		const documents = buildPack({ id: "masks-newgeneration-unofficial.documents", name: "documents", type: "JournalEntry" });
		const otherSystem = buildPack({ id: "some-other-module.stuff", name: "stuff", system: "other" });
		vi.stubGlobal("game", { packs: buildPacksCollection([beacon, bull, moves, documents, otherSystem]) });

		expect(listPlaybookPacks()).toEqual([beacon, bull]);
	});
});

describe("listPlaybookMoves", () => {
	it("returns only playbook-type moves, mapped to picker options including their hit-result text", () => {
		const enrichHTML = stubTextEditorEnrichment();
		const moveResults = { success: { label: "Success!", value: "<p>Choose one.</p>" } };
		const playbookMove = buildMoveDoc({
			uuid: "uuid1",
			name: "Drives",
			moveType: "playbook",
			description: "<p>d</p>",
			moveResults
		});
		const basicMove = buildMoveDoc({ uuid: "uuid2", name: "Unleash Your Powers", moveType: "basic" });
		const pack = buildPack({ id: "masks-newgeneration-unofficial.basic-playbook-beacon", name: "basic-playbook-beacon", documents: [playbookMove, basicMove] });
		vi.stubGlobal("game", { packs: buildPacksCollection([pack]) });

		return listPlaybookMoves(pack.metadata.id).then((moves) => {
			expect(moves).toEqual([
				{
					uuid: "uuid1",
					name: "Drives",
					description: "[enriched]<p>d</p>[/enriched]",
					moveResults: { success: { label: "Success!", value: "[enriched]<p>Choose one.</p>[/enriched]" } },
					img: "icon.svg"
				}
			]);
			expect(pack.getDocuments).toHaveBeenCalledWith({ type: "move" });
			expect(enrichHTML).toHaveBeenCalledWith("<p>d</p>", expect.objectContaining({ relativeTo: playbookMove }));
			expect(enrichHTML).toHaveBeenCalledWith("<p>Choose one.</p>", expect.objectContaining({ relativeTo: playbookMove }));
		});
	});

	it("returns an empty array when the pack can't be found", async () => {
		vi.stubGlobal("game", { packs: buildPacksCollection([]) });

		expect(await listPlaybookMoves("nonexistent")).toEqual([]);
	});

	it("enriches @UUID move-link text in the description instead of leaving it as raw markup", async () => {
		const enrichHTML = stubTextEditorEnrichment();
		const rawDescription =
			"You can use it to @UUID[Compendium.masks-newgeneration-unofficial.moves.Item.6rnOFrthWetWrS7c]{Unleash Your Powers}.";
		const playbookMove = buildMoveDoc({ uuid: "uuid1", name: "Kirby-Craft", moveType: "playbook", description: rawDescription });
		const pack = buildPack({ id: "masks-newgeneration-unofficial.basic-playbook-beacon", name: "basic-playbook-beacon", documents: [playbookMove] });
		vi.stubGlobal("game", { packs: buildPacksCollection([pack]) });

		const [move] = await listPlaybookMoves(pack.metadata.id);

		expect(enrichHTML).toHaveBeenCalledWith(rawDescription, expect.objectContaining({ relativeTo: playbookMove }));
		expect(move.description).toBe(`[enriched]${rawDescription}[/enriched]`);
	});
});

describe("listAdultMoves", () => {
	it("returns exactly the 5 canonical adult moves, excluding anything else in the adult-move pool", async () => {
		const documents = [
			buildMoveDoc({ uuid: "u1", name: "Wield Your Powers", moveType: "adult" }),
			buildMoveDoc({ uuid: "u2", name: "Overwhelm a Vulnerable Foe", moveType: "adult" }),
			buildMoveDoc({ uuid: "u3", name: "Persuade With Best Interests", moveType: "adult" }),
			buildMoveDoc({ uuid: "u4", name: "Empathize", moveType: "adult" }),
			buildMoveDoc({ uuid: "u5", name: "Stand Up For Something", moveType: "adult" }),
			buildMoveDoc({ uuid: "u6", name: "Some Homebrew Move", moveType: "adult" }),
			buildMoveDoc({ uuid: "u7", name: "Rejecting Influence", moveType: "rules" })
		];
		const pack = buildPack({ id: "masks-newgeneration-unofficial.moves", name: "moves", documents });
		vi.stubGlobal("game", { packs: buildPacksCollection([pack]) });

		const moves = await listAdultMoves();

		expect(moves.map((m) => m.name)).toEqual([
			"Wield Your Powers",
			"Overwhelm a Vulnerable Foe",
			"Persuade With Best Interests",
			"Empathize",
			"Stand Up For Something"
		]);
	});
});

describe("excludeAlreadyOwned", () => {
	it("filters out moves the actor already owns by name", () => {
		const actor = buildActor([{ type: "move", name: "Empathize" }]);
		const moves = [
			{ uuid: "u1", name: "Empathize" },
			{ uuid: "u2", name: "Wield Your Powers" }
		];

		expect(excludeAlreadyOwned(actor, moves)).toEqual([{ uuid: "u2", name: "Wield Your Powers" }]);
	});

	it("ignores non-move items with a matching name", () => {
		const actor = buildActor([{ type: "playbook", name: "Empathize" }]);
		const moves = [{ uuid: "u1", name: "Empathize" }];

		expect(excludeAlreadyOwned(actor, moves)).toEqual(moves);
	});
});

describe("addMoveToActor", () => {
	it("creates an embedded copy of the source compendium move on the actor", async () => {
		const actor = buildActor([]);
		const sourceObject = { name: "Empathize", type: "move", system: { moveType: "adult" } };
		vi.stubGlobal("fromUuid", vi.fn().mockResolvedValue({ toObject: () => sourceObject }));

		await addMoveToActor(actor, "Compendium.masks-newgeneration-unofficial.moves.Item.cs5MLESc25yDhL4B");

		expect(actor.createEmbeddedDocuments).toHaveBeenCalledWith("Item", [sourceObject]);
	});

	it("does nothing when the uuid doesn't resolve", async () => {
		const actor = buildActor([]);
		vi.stubGlobal("fromUuid", vi.fn().mockResolvedValue(null));

		await addMoveToActor(actor, "Compendium.does.not.Item.exist");

		expect(actor.createEmbeddedDocuments).not.toHaveBeenCalled();
	});
});

describe("initMovePicker", () => {
	let handler;

	beforeEach(() => {
		vi.stubGlobal("Hooks", {
			on: vi.fn((hook, fn) => {
				if (hook === "renderActorSheet") handler = fn;
			})
		});
		vi.stubGlobal("game", { i18n: { localize: (key) => key } });
		vi.stubGlobal("ui", { notifications: { warn: vi.fn() } });
		vi.stubGlobal("foundry", {
			applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue(null) } } }
		});
		initMovePicker();
	});

	it("registers a renderActorSheet hook", () => {
		expect(Hooks.on).toHaveBeenCalledWith("renderActorSheet", expect.any(Function));
	});

	it("intercepts clicks on the playbook move-picker button before pbta's own handler runs", () => {
		const root = document.createElement("form");
		const button = document.createElement("button");
		button.className = "masks-move-picker";
		button.dataset.moveType = "playbook";
		root.appendChild(button);
		const app = { actor: buildActor([]) };

		handler(app, [root]);

		const event = new MouseEvent("click", { bubbles: true, cancelable: true });
		const preventDefaultSpy = vi.spyOn(event, "preventDefault");
		const stopSpy = vi.spyOn(event, "stopImmediatePropagation");
		button.dispatchEvent(event);

		expect(preventDefaultSpy).toHaveBeenCalled();
		expect(stopSpy).toHaveBeenCalled();
	});

	it("does nothing for a non-character actor sheet", () => {
		const root = document.createElement("form");
		const button = document.createElement("button");
		button.className = "masks-move-picker";
		button.dataset.moveType = "adult";
		root.appendChild(button);
		const app = { actor: { type: "npc" } };

		expect(() => handler(app, [root])).not.toThrow();

		const event = new MouseEvent("click", { bubbles: true, cancelable: true });
		const stopSpy = vi.spyOn(event, "stopImmediatePropagation");
		button.dispatchEvent(event);

		expect(stopSpy).not.toHaveBeenCalled();
	});

	function clickMovePickerButton(app, moveType) {
		const root = document.createElement("form");
		const button = document.createElement("button");
		button.className = "masks-move-picker";
		button.dataset.moveType = moveType;
		root.appendChild(button);

		handler(app, [root]);
		button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
	}

	it("opens the playbook choice dialog forced to the module's light theme, with themed buttons", () => {
		const actor = buildActor([{ type: "playbook", name: "The Beacon" }]);

		clickMovePickerButton({ actor }, "playbook");

		expect(foundry.applications.api.DialogV2.wait).toHaveBeenCalledWith(
			expect.objectContaining({
				classes: expect.arrayContaining(["themed", "theme-light"]),
				buttons: [
					expect.objectContaining({ action: "own", class: "dialog-button" }),
					expect.objectContaining({ action: "other", class: "dialog-button" }),
					expect.objectContaining({ action: "blank", class: "dialog-button" })
				]
			})
		);
	});

	it("opens the other-playbook picker forced to the module's light theme, with a themed Next button", async () => {
		const actor = buildActor([{ type: "playbook", name: "The Beacon" }]);
		vi.stubGlobal("game", {
			i18n: { localize: (key) => key },
			packs: buildPacksCollection([buildPack({ id: "masks-newgeneration-unofficial.basic-playbook-bull", name: "basic-playbook-bull" })])
		});
		const wait = vi.fn().mockResolvedValueOnce("other").mockResolvedValueOnce(null);
		vi.stubGlobal("foundry", { applications: { api: { DialogV2: { wait } } } });

		clickMovePickerButton({ actor }, "playbook");
		await vi.waitFor(() => expect(wait).toHaveBeenCalledTimes(2));

		expect(wait).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				classes: expect.arrayContaining(["themed", "theme-light"]),
				buttons: [expect.objectContaining({ action: "next", class: "dialog-button" })]
			})
		);
	});

	it("opens the move list dialog forced to the module's light theme, with a themed Add button", async () => {
		const move = buildMoveDoc({ uuid: "uuid1", name: "Wield Your Powers", moveType: "adult" });
		const pack = buildPack({ id: "masks-newgeneration-unofficial.moves", name: "moves", documents: [move] });
		const enrichHTML = vi.fn((text) => Promise.resolve(text));
		vi.stubGlobal("game", { i18n: { localize: (key) => key }, packs: buildPacksCollection([pack]) });
		const wait = vi.fn().mockResolvedValue(null);
		vi.stubGlobal("foundry", {
			applications: {
				ux: { TextEditor: { implementation: { enrichHTML } } },
				api: { DialogV2: { wait } }
			}
		});

		clickMovePickerButton({ actor: buildActor([]) }, "adult");
		await vi.waitFor(() => expect(wait).toHaveBeenCalledTimes(1));

		expect(wait).toHaveBeenCalledWith(
			expect.objectContaining({
				classes: expect.arrayContaining(["themed", "theme-light"]),
				buttons: [expect.objectContaining({ action: "add", class: "dialog-button" })]
			})
		);
	});
});
