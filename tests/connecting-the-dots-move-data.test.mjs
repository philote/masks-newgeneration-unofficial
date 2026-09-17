import { describe, expect, it } from "vitest";
import moveData from "../src/packs/unbound-playbook-harbinger/move_Connecting_the_Dots_HCswUIs9sYKviY0J.json";

describe("Connecting the Dots move data", () => {
	it("falls back to pbta's own stat picker if the rollOptions flag is ever absent", () => {
		expect(moveData.system.rollType).toBe("ask");
	});

	it("lists the two rolls it can stand in for, so the roll picker has something to offer", () => {
		expect(moveData.flags["masks-newgeneration-unofficial"].rollOptions).toEqual([
			{
				label: "Remember someone's future self",
				attributeRollKey: "theHarbingerMemories",
				moveResults: {
					success: {
						key: "data.moveResults.success.value",
						label: "Success!",
						value: "<p>You connect who they are now to who they are in the future; choose the role that they fulfill in the future, and the GM will tell you about their future self. You can also ask a follow-up question.</p>"
					},
					partial: {
						key: "data.moveResults.partial.value",
						label: "Partial success",
						value: "<p>You connect who they are now to who they are in the future; choose the role that they fulfill in the future, and the GM will tell you about their future self.</p>"
					},
					failure: {
						key: "data.moveResults.failure.value",
						label: "Complications...",
						value: "<p>They're not at all who you thought they would be; the GM will choose their role, or tell you that as far as you know, they don't exist in the future.</p>"
					}
				}
			},
			{
				label: "Investigate the timeline",
				rollType: "savior",
				moveResults: {
					success: {
						key: "data.moveResults.success.value",
						label: "Success!",
						value: "<p>Choose one figure noted above or one aspect of the future world you can remember. You've found a lead to follow to learn more about how the present version of that figure or aspect became the future version. The lead is particularly strong; right now, you can ask the GM one question about the figure or aspect, and they will answer honestly.</p>"
					},
					partial: {
						key: "data.moveResults.partial.value",
						label: "Partial success",
						value: "<p>Choose one figure noted above or one aspect of the future world you can remember. You've found a lead to follow to learn more about how the present version of that figure or aspect became the future version.</p>"
					},
					failure: {
						key: "data.moveResults.failure.value",
						label: "Complications...",
						value: "<p>You're lost in the present; the GM will tell you how things are so different here, and shift your Labels according to how it makes you feel.</p>"
					}
				}
			}
		]);
	});
});
