export const configSheet = async () => {
    // Pass Masks sheet object to sheetConfig
    game.pbta.sheetConfig = {
        rollFormula: "2d6",
        statToggle: {
            label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.statToggle"),
            modifier: 0
        },
        minMod: -3,
        maxMod: 4,
        rollResults: {
            failure: {
                start: null,
                end: 6,
                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.rollResults.complications")
            },
            partial: {
                start: 7,
                end: 9,
                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.rollResults.partialSuccess")
            },
            success: {
                start: 10,
                end: null,
                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.rollResults.success")
            }
        },
        actorTypes: {
            character: {
                stats: {
                    danger: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.stats.danger"),
                        value: 0
                    },
                    freak: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.stats.freak"),
                        value: 0
                    },
                    savior: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.stats.savior"),
                        value: 0
                    },
                    superior: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.stats.superior"),
                        value: 0
                    },
                    mundane: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.stats.mundane"),
                        value: 0
                    }
                },
                attrTop: {
                    heroName: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.heroNameLabel"),
                        description: null,
                        customLabel: false,
                        userLabel: false,
                        type: "Text",
                        value: ""
                    },
                    advances: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.advancesLabel"),
                        description: null,
                        customLabel: false,
                        userLabel: false,
                        type: "Number",
                        value: 0
                    },
                    xp: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.xpLabel"),
                        description: null,
                        customLabel: false,
                        userLabel: false,
                        type: "Xp",
                        value: 0,
                        max: 5,
                        steps: [false, false, false, false, false]
                    },
                    theDoomed: {
                        type: "Clock",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theDoomedLabel"),
                        max: 5,
                        default: 0,
                        playbook: "The Doomed",
                        steps: [false, false, false, false, false]
                    },
                    theBull: {
                        type: "LongText",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theBull.label"),
                        playbook: "The Bull",
                        value: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theBull.value"),
                    },
                    theNova: {
                        type: "Number",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theNovaLabel"),
                        playbook: "The Nova",
                        default: 0
                    },
                    theProtege: {
                        type: "LongText",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theProtege.label"),
                        playbook: "The Protégé",
                        value: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theProtege.value"),
                    },
                    theSoldier: {
                        type: "Number",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theSoldierLabel"),
                        playbook: "The Soldier",
                        default: 2
                    },
                    theHarbinger: {
                        type: "Number",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theHarbingerLabel"),
                        playbook: "The Harbinger",
                        default: -1
                    },
                    theNomad: {
                        type: "Number",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theNomadLabel"),
                        playbook: "The Nomad",
                        default: 0,
                        max: 6
                    },
                    theBrain: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theBrainLabel"),
                        playbook: "The Brain",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false
                            }
                        }
                    }
                },
                attrLeft: {
                    conditions: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.label"),
                        description: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.description"),
                        customLabel: false,
                        userLabel: false,
                        type: "ListMany",
                        condition: true,
                        options: {
                            0: {
                                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.options.0"),
                                value: false
                            },
                            1: {
                                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.options.1"),
                                value: false
                            },
                            2: {
                                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.options.2"),
                                value: false
                            },
                            3: {
                                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.options.3"),
                                value: false
                            },
                            4: {
                                label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.conditions.options.4"),
                                value: false
                            }
                        }
                    },
                    theScionGreatestEnemy: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theScionGreatestEnemyLabel"),
                        playbook: "The Scion",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false,
                                values: {
                                    0: {value: false},
                                    1: {value: false},
                                    2: {value: false},
                                    3: {value: false},
                                    4: {value: false}
                                }
                            }
                        }
                    },
                    theScionGreatestVictim: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theScionGreatestVictimLabel"),
                        playbook: "The Scion",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false,
                                values: {
                                    0: {value: false},
                                    1: {value: false},
                                    2: {value: false},
                                    3: {value: false},
                                    4: {value: false}
                                }
                            }
                        }
                    },
                    theScionPersonalIdol: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theScionPersonalIdolLabel"),
                        playbook: "The Scion",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false,
                                values: {
                                    0: {value: false},
                                    1: {value: false},
                                    2: {value: false},
                                    3: {value: false},
                                    4: {value: false}
                                }
                            }
                        }
                    },
                    theScionGreatestLeader: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theScionGreatestLeaderLabel"),
                        playbook: "The Scion",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false,
                                values: {
                                    0: {value: false},
                                    1: {value: false},
                                    2: {value: false},
                                    3: {value: false},
                                    4: {value: false}
                                }
                            }
                        }
                    },
                    theScionGreatestHero: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theScionGreatestHeroLabel"),
                        playbook: "The Scion",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false,
                                values: {
                                    0: {value: false},
                                    1: {value: false},
                                    2: {value: false},
                                    3: {value: false},
                                    4: {value: false}
                                }
                            }
                        }
                    },
                    theScionBiggestCelebrity: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theScionBiggestCelebrityLabel"),
                        playbook: "The Scion",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false,
                                values: {
                                    0: {value: false},
                                    1: {value: false},
                                    2: {value: false},
                                    3: {value: false},
                                    4: {value: false}
                                }
                            }
                        }
                    },
                    theHarbinger: {
                        type: "LongText",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theHarbinger.label"),
                        playbook: "The Harbinger",
                        value: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theHarbinger.value"),
                    },
                    theStarAdvantages: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theStarAdvantagesLabel"),
                        playbook: "The Star",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false
                            },
                            1: {
                                label: "[Text]",
                                value: false
                            }
                        }
                    },
                    theStarDemands: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theStarDemandsLabel"),
                        playbook: "The Star",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false
                            },
                            1: {
                                label: "[Text]",
                                value: false
                            }
                        }
                    },
                    theInnocent: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theInnocentLabel"),
                        playbook: "The Innocent",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false
                            },
                            1: {
                                label: "[Text]",
                                value: false
                            },
                            2: {
                                label: "[Text]",
                                value: false
                            },
                            3: {
                                label: "[Text]",
                                value: false
                            }
                        }
                    },
                    theNewborn: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theNewbornLabel"),
                        playbook: "The Newborn",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false
                            },
                            1: {
                                label: "[Text]",
                                value: false
                            },
                            2: {
                                label: "[Text]",
                                value: false
                            },
                            3: {
                                label: "[Text]",
                                value: false
                            }
                        }
                    },
                    theReformed: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theReformedLabel"),
                        playbook: "The Reformed",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false,
                                values: {
                                    0: {value: false},
                                    1: {value: false},
                                    2: {value: false},
                                    3: {value: false}
                                }
                            },
                            1: {
                                label: "[Text]",
                                value: false,
                                values: {
                                    0: {value: false},
                                    1: {value: false},
                                    2: {value: false},
                                    3: {value: false}
                                }
                            },
                            2: {
                                label: "[Text]",
                                value: false,
                                values: {
                                    0: {value: false},
                                    1: {value: false},
                                    2: {value: false},
                                    3: {value: false}
                                }
                            }
                        }
                    },
                    theJanus: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theJanusLabel"),
                        playbook: "The Janus",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false
                            },
                            1: {
                                label: "[Text]",
                                value: false
                            },
                            2: {
                                label: "[Text]",
                                value: false
                            }
                        }
                    },
                    theProtege: {
                        type: "LongText",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theProtegeLabel"),
                        playbook: "The Protégé",
                        value: ""
                    },
                    theLegacy: {
                        type: "LongText",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theLegacy.label"),
                        playbook: "The Legacy",
                        value: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theLegacy.value"),
                    },
                    theBeacon: {
                        type: "ListMany",
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.Playbooks.theBeaconLabel"),
                        playbook: "The Beacon",
                        options: {
                            0: {
                                label: "[Text]",
                                value: false
                            },
                            1: {
                                label: "[Text]",
                                value: false
                            },
                            2: {
                                label: "[Text]",
                                value: false
                            },
                            3: {
                                label: "[Text]",
                                value: false
                            }
                        }
                    },
                    momentUnlocked: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.momentUnlocked.label"),
                        description: null,
                        customLabel: false,
                        userLabel: false,
                        type: "Checkbox",
                        checkboxLabel: game.i18n.localize("MASKS-SHEETS.CharacterSheets.momentUnlocked.checkboxLabel"),
                        value: false
                    },
                    influence: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.influenceLabel"),
                        description: null,
                        customLabel: false,
                        userLabel: false,
                        type: "LongText",
                        value: ""
                    },
                    advancements: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.advancementsLabel"),
                        description: null,
                        customLabel: false,
                        userLabel: false,
                        type: "ListMany",
                        condition: false,
                        options: {
                            0: {
                                label: "[Text]",
                                value: false
                            },
                            1: {
                                label: "[Text]",
                                value: false
                            },
                            2: {
                                label: "[Text]",
                                value: false
                            },
                            3: {
                                label: "[Text]",
                                value: false
                            },
                            4: {
                                label: "[Text]",
                                value: false
                            }
                        }
                    }
                },
                details: {
                    look: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.lookLabel"),
                        value: ""
                    },
                    abilities: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.abilitiesLabel"),
                        value: "",
                        limited: false
                    },
                    moment: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.momentLabel"),
                        value: "",
                        limited: true
                    },
                    backstory: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.backstoryLabel"),
                        value: ""
                    },
                    team: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.teamLabel"),
                        value: ""
                    },
                    relationships: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.relationshipsLabel"),
                        value: ""
                    },
                    biography: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.details.biographyLabel"),
                        value: ""
                    }
                },
                moveTypes: {
                    basic: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.moveTypes.basicLabel"),
                        moves: [],
                        creation: true
                    },
                    playbook: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.moveTypes.playbookLabel"),
                        moves: [],
                        playbook: true
                    },
                    team: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.moveTypes.teamLabel"),
                        moves: [],
                        playbook: true
                    },
                    adult: {
                        label: game.i18n.localize("MASKS-SHEETS.CharacterSheets.moveTypes.adultLabel"),
                        moves: []
                    }
                }
            },
            npc: {
                attrTop: {
                    realName: {
                        label: game.i18n.localize("MASKS-SHEETS.NPCSheets.realName"),
                        description: null,
                        customLabel: false,
                        userLabel: false,
                        type: "Text",
                        value: ""
                    }
                },
                attrLeft: {
                    conditions: {
                        label: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.label"),
                        description: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.description"),
                        customLabel: false,
                        userLabel: false,
                        type: "ListMany",
                        condition: false,
                        options: {
                            0: {
                                label: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.options.0"),
                                value: false
                            },
                            1: {
                                label: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.options.1"),
                                value: false
                            },
                            2: {
                                label: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.options.2"),
                                value: false
                            },
                            3: {
                                label: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.options.3"),
                                value: false
                            },
                            4: {
                                label: game.i18n.localize("MASKS-SHEETS.NPCSheets.conditions.options.4"),
                                value: false
                            }
                        }
                    },
                    drive: {
                        label: game.i18n.localize("MASKS-SHEETS.NPCSheets.driveLabel"),
                        description: null,
                        customLabel: false,
                        userLabel: false,
                        type: "LongText",
                        value: ""
                    },
                    abilities: {
                        label: game.i18n.localize("MASKS-SHEETS.NPCSheets.abilitiesLabel"),
                        description: null,
                        customLabel: false,
                        userLabel: false,
                        type: "LongText",
                        value: ""
                    },
                    generation: {
                        label: game.i18n.localize("MASKS-SHEETS.NPCSheets.generationLabel"),
                        description: null,
                        customLabel: false,
                        userLabel: false,
                        type: "Text",
                        value: ""
                    }
                },
                moveTypes: {
                    villain: {
                        label: game.i18n.localize("MASKS-SHEETS.NPCSheets.moveTypes.villainLabel"),
                        moves: []
                    },
                    condition: {
                        label: game.i18n.localize("MASKS-SHEETS.NPCSheets.moveTypes.conditionLabel"),
                        moves: []
                    }
                }
            }
        }
    }
};