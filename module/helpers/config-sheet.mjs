export const configSheet = async () => {
  // Pass Masks sheet object to sheetConfig
  game.pbta.sheetConfig = {
    rollFormula: "2d6",
    rollShifting: true,
    statShifting: {
      label: game.i18n.localize("MASKS-SHEETS.Shift-Labels.label"),
      img: "systems/pbta/assets/icons/svg/back-forth.svg",
      value: 1,
      labels: {
        stat: game.i18n.localize("MASKS-SHEETS.Shift-Labels.stat"),
        stats: game.i18n.localize("MASKS-SHEETS.Shift-Labels.stats"),
      },
    },
    statToggle: {
      label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.statToggle"),
      modifier: 0,
    },
    minMod: -3,
    maxMod: 4,
    rollResults: {
      failure: {
        start: null,
        end: 6,
        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.rollResults.complications"),
      },
      partial: {
        start: 7,
        end: 9,
        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.rollResults.partialSuccess"),
      },
      success: {
        start: 10,
        end: null,
        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.rollResults.success"),
      },
    },
    actorTypes: {
      character: {
        stats: {
          danger: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.stats.danger"),
            value: 0,
          },
          freak: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.stats.freak"),
            value: 0,
          },
          savior: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.stats.savior"),
            value: 0,
          },
          superior: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.stats.superior"),
            value: 0,
          },
          mundane: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.stats.mundane"),
            value: 0,
          },
        },
        attributes: {
          realName: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.realNameLabel"),
            description: null,
            customLabel: false,
            userLabel: false,
            type: "Text",
            value: ""
          },
          xp: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.xpLabel"),
            description: null,
            customLabel: false,
            userLabel: false,
            type: "Xp",
            value: 0,
            max: 5,
            steps: Array(5).fill(false),
            position: "Top"
          },
          theDoomed: {
            type: "Clock",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theDoomed.track"),
            max: 5,
            value: 0,
            playbook: "The Doomed",
            steps: Array(5).fill(false),
            position: "Top"
          },
          theBull: {
            type: "LongText",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theBull.label"),
            playbook: "The Bull",
            position: "Top"
          },
          theNova: {
            type: "Number",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theNovaLabel"),
            playbook: "The Nova",
            value: 0,
            position: "Top"
          },
          theProtege: {
            type: "LongText",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theProtege.label"),
            playbook: "The Protégé",
            position: "Top"
          },
          theSoldier: {
            type: "Number",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theSoldierLabel"),
            playbook: "The Soldier",
            value: 2,
            position: "Top"
          },
          theHarbingerMemories: {
            type: "Number",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theHarbingerLabel"),
            playbook: "The Harbinger",
            value: -1,
            position: "Top"
          },
          theNomad: {
            type: "Number",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theNomadLabel"),
            playbook: "The Nomad",
            value: 0,
            max: 6,
            position: "Top"
          },
          theBrain: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theBrainLabel"),
            playbook: "The Brain",
            options: {
              0: {
                label: "[Text]",
                value: false,
              },
            },
            position: "Top"
          },
          conditions: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.label"),
            description: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.description"),
            customLabel: false,
            userLabel: false,
            type: "ListMany",
            condition: true,
            position: "Left",
            options: {
              0: {
                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.options.0"),
                value: false,
              },
              1: {
                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.options.1"),
                value: false,
              },
              2: {
                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.options.2"),
                value: false,
              },
              3: {
                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.options.3"),
                value: false,
              },
              4: {
                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.options.4"),
                value: false,
              },
            },
          },
          bringsDoomCloser: {
            type: "ListMany",
            condition: false,
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theDoomed.bringsDoomCloser.label"),
            description: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theDoomed.bringsDoomCloser.description"),
            playbook: "The Doomed",
            position: "Left",
          },
          doomedSanctuaryFeatures: {
            type: "LongText",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theDoomed.sanctuary.features.label"),
            description: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theDoomed.sanctuary.features.description"),
            playbook: "The Doomed",
            position: "Left",
          },
          doomedSanctuaryDownsides: {
            type: "LongText",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theDoomed.sanctuary.downsides.label"),
            description: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theDoomed.sanctuary.downsides.description"),
            playbook: "The Doomed",
            position: "Left",
          },
          theScionGreatestEnemy: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theScionGreatestEnemyLabel"),
            playbook: "The Scion",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
                values: {
                  0: { value: false },
                  1: { value: false },
                  2: { value: false },
                  3: { value: false },
                  4: { value: false },
                },
              },
            },
          },
          theScionGreatestVictim: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theScionGreatestVictimLabel"),
            playbook: "The Scion",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
                values: {
                  0: { value: false },
                  1: { value: false },
                  2: { value: false },
                  3: { value: false },
                  4: { value: false },
                },
              },
            },
          },
          theScionPersonalIdol: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theScionPersonalIdolLabel"),
            playbook: "The Scion",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
                values: {
                  0: { value: false },
                  1: { value: false },
                  2: { value: false },
                  3: { value: false },
                  4: { value: false },
                },
              },
            },
          },
          theScionGreatestLeader: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theScionGreatestLeaderLabel"),
            playbook: "The Scion",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
                values: {
                  0: { value: false },
                  1: { value: false },
                  2: { value: false },
                  3: { value: false },
                  4: { value: false },
                },
              },
            },
          },
          theScionGreatestHero: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theScionGreatestHeroLabel"),
            playbook: "The Scion",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
                values: {
                  0: { value: false },
                  1: { value: false },
                  2: { value: false },
                  3: { value: false },
                  4: { value: false },
                },
              },
            },
          },
          theScionBiggestCelebrity: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theScionBiggestCelebrityLabel"),
            playbook: "The Scion",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
                values: {
                  0: { value: false },
                  1: { value: false },
                  2: { value: false },
                  3: { value: false },
                  4: { value: false },
                },
              },
            },
          },
          theHarbinger: {
            type: "LongText",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theHarbinger.label"),
            playbook: "The Harbinger",
            position: "Left",
          },
          theStarAdvantages: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theStarAdvantagesLabel"),
            playbook: "The Star",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
              },
              1: {
                label: "[Text]",
                value: false,
              },
            },
          },
          theStarDemands: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theStarDemandsLabel"),
            playbook: "The Star",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
              },
              1: {
                label: "[Text]",
                value: false,
              },
            },
          },
          theInnocent: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theInnocentLabel"),
            playbook: "The Innocent",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
              },
              1: {
                label: "[Text]",
                value: false,
              },
              2: {
                label: "[Text]",
                value: false,
              },
              3: {
                label: "[Text]",
                value: false,
              },
            },
          },
          theNewborn: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theNewbornLabel"),
            playbook: "The Newborn",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
              },
              1: {
                label: "[Text]",
                value: false,
              },
              2: {
                label: "[Text]",
                value: false,
              },
              3: {
                label: "[Text]",
                value: false,
              },
            },
          },
          theReformed: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theReformedLabel"),
            playbook: "The Reformed",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
                values: {
                  0: { value: false },
                  1: { value: false },
                  2: { value: false },
                  3: { value: false },
                },
              },
              1: {
                label: "[Text]",
                value: false,
                values: {
                  0: { value: false },
                  1: { value: false },
                  2: { value: false },
                  3: { value: false },
                },
              },
              2: {
                label: "[Text]",
                value: false,
                values: {
                  0: { value: false },
                  1: { value: false },
                  2: { value: false },
                  3: { value: false },
                },
              },
            },
          },
          theJanus: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theJanusLabel"),
            playbook: "The Janus",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
              },
              1: {
                label: "[Text]",
                value: false,
              },
              2: {
                label: "[Text]",
                value: false,
              },
            },
          },
          theProtegeMentorsResources: {
            type: "LongText",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theProtege.resources.label"),
            description: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theProtege.resources.description"),
            playbook: "The Protégé",
            position: "Left",
          },
          theLegacy: {
            type: "LongText",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theLegacy.label"),
            playbook: "The Legacy",
            value: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theLegacy.value"),
            position: "Left",
          },
          theBeacon: {
            type: "ListMany",
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theBeaconLabel"),
            playbook: "The Beacon",
            position: "Left",
            options: {
              0: {
                label: "[Text]",
                value: false,
              },
              1: {
                label: "[Text]",
                value: false,
              },
              2: {
                label: "[Text]",
                value: false,
              },
              3: {
                label: "[Text]",
                value: false,
              },
            },
          },
          momentUnlocked: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.momentUnlocked.label"),
            description: null,
            customLabel: false,
            userLabel: false,
            type: "Checkbox",
            checkboxLabel: game.i18n.localize("MASKS-SHEETS.CharacterSheets.momentUnlocked.checkboxLabel"),
            value: false,
          },
          advancements: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.advancementsLabel"),
            description: game.i18n.localize("MASKS-SHEETS.CharacterSheets.advancementsDescription"),
            customLabel: false,
            userLabel: false,
            type: "ListMany",
            condition: false,
            playbook: true,
          },
          laterAdvances: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.laterAdvancesLabel"),
            description: game.i18n.localize("MASKS-SHEETS.CharacterSheets.laterAdvancesDescription"),
            customLabel: false,
            userLabel: false,
            type: "ListMany",
            condition: false,
            playbook: true,
          },
          relationshipQuestions: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.relationshipsLabel"),
            description: null,
            customLabel: false,
            userLabel: false,
            type: "LongText",
            playbook: true,
          },
          momentOfTruth: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.momentLabel"),
            description: null,
            customLabel: false,
            userLabel: false,
            type: "LongText",
            playbook: true,
          },
          teamQuestion: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.teamLabel"),
            description: null,
            customLabel: false,
            userLabel: false,
            type: "LongText",
            playbook: true,
          },
        },
        details: {
          look: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.lookLabel"),
            description: null,
            customLabel: false,
            userLabel: false,
            type: "LongText",
            playbook: true,
            value: "",
          },
          abilities: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.abilitiesLabel"),
            description: null,
            customLabel: false,
            userLabel: false,
            type: "LongText",
            value: "",
            playbook: true,
          },
          backstory: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.backstoryLabel"),
            description: null,
            customLabel: false,
            userLabel: false,
            type: "LongText",
            value: "",
            playbook: true,
          },
          biography: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.biographyLabel"),
            description: null,
            customLabel: false,
            userLabel: false,
            type: "LongText",
            value: "",
          },
        },
        moveTypes: {
          basic: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.moveTypes.basicLabel"),
            creation: true,
          },
          playbook: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.moveTypes.playbookLabel"),
            playbook: true,
          },
          adult: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.moveTypes.adultLabel"),
          },
          rules: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.moveTypes.rulesLabel"),
            creation: true,
          },
        },
      },
      npc: {
        attributes: {
          conditions: {
            label: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.label"),
            description: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.description"),
            customLabel: false,
            userLabel: false,
            type: "ListMany",
            condition: false,
            position: "Left",
            options: {
              0: {
                label: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.options.0"),
                value: false,
              },
              1: {
                label: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.options.1"),
                value: false,
              },
              2: {
                label: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.options.2"),
                value: false,
              },
              3: {
                label: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.options.3"),
                value: false,
              },
              4: {
                label: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.options.4"),
                value: false,
              },
            },
          },
          realName: {
            label: game.i18n.localize("MASKS-SHEETS.NPCSheets.realName"),
            description: null,
            customLabel: false,
            userLabel: false,
            type: "Text",
            value: "",
            position: "Left",
          },
          generation: {
            label: game.i18n.localize("MASKS-SHEETS.NPCSheets.generationLabel"),
            description: null,
            customLabel: false,
            userLabel: false,
            type: "Text",
            value: "",
            position: "Left",
          },
        },
        details: {
          drive: {
            label: game.i18n.localize("MASKS-SHEETS.NPCSheets.driveLabel"),
            value: "",
          },
          abilities: {
            label: game.i18n.localize("MASKS-SHEETS.NPCSheets.abilitiesLabel"),
            value: "",
          },
          biography: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.biographyLabel"),
            value: "",
          },
        },
        moveTypes: {
          villain: {
            label: game.i18n.localize("MASKS-SHEETS.NPCSheets.moveTypes.villainLabel"),
            moves: [],
          },
          condition: {
            label: game.i18n.localize("MASKS-SHEETS.NPCSheets.moveTypes.conditionLabel"),
            moves: [],
          },
        },
      },
    },
  };
};
