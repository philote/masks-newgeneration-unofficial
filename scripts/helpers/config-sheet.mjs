export const configSheet = async () => {
    // Pass Masks sheet object to sheetConfig
    game.pbta.sheetConfig = {
        "rollFormula": "2d6",
        "statToggle": {
            "label": "Locked",
            "modifier": 0
        },
        "minMod": -3,
        "maxMod": 4,
        "rollResults": {
            "failure": {
                "start": null,
                "end": 6,
                "label": "Complications..."
            },
            "partial": {
                "start": 7,
                "end": 9,
                "label": "Partial success"
            },
            "success": {
                "start": 10,
                "end": null,
                "label": "Success!"
            }
        },
        "actorTypes": {
            "character": {
                "stats": {
                    "danger": {
                        "label": "Danger",
                        "value": 0
                    },
                    "freak": {
                        "label": "Freak",
                        "value": 0
                    },
                    "savior": {
                        "label": "Savior",
                        "value": 0
                    },
                    "superior": {
                        "label": "Superior",
                        "value": 0
                    },
                    "mundane": {
                        "label": "Mundane",
                        "value": 0
                    }
                },
                "attrTop": {
                    "heroName": {
                        "label": "Hero Name",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "Text",
                        "value": ""
                    },
                    "advances": {
                        "label": "Advances",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "Number",
                        "value": 0
                    },
                    "xp": {
                        "label": "Potential",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "Xp",
                        "value": 0,
                        "max": 5,
                        "steps": [
                            false,
                            false,
                            false,
                            false,
                            false
                        ]
                    },
                    "momentUnlocked": {
                        "label": "Moment of Truth",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "Checkbox",
                        "checkboxLabel": "Unlocked",
                        "value": false
                    }
                },
                "attrLeft": {
                    "conditions": {
                        "label": "Conditions",
                        "description": "Choose all that apply:",
                        "customLabel": false,
                        "userLabel": false,
                        "type": "ListMany",
                        "condition": true,
                        "options": {
                            "0": {
                                "label": "Afraid (-2 to engage)",
                                "value": false
                            },
                            "1": {
                                "label": "Angry (-2 to comfort or pierce)",
                                "value": false
                            },
                            "2": {
                                "label": "Guilty (-2 to provoke or assess)",
                                "value": false
                            },
                            "3": {
                                "label": "Hopeless (-2 to unleash)",
                                "value": false
                            },
                            "4": {
                                "label": "Insecure (-2 to defend or reject)",
                                "value": false
                            }
                        }
                    },
                    "look": {
                        "label": "Look",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "LongText",
                        "value": ""
                    },
                    "abilities": {
                        "label": "Abilities",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "LongText",
                        "value": ""
                    },
                    "influence": {
                        "label": "Influence",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "LongText",
                        "value": ""
                    },
                    "moment": {
                        "label": "Moment of Truth",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "LongText",
                        "value": ""
                    },
                    "advancements": {
                        "label": "Advancements",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "ListMany",
                        "condition": false,
                        "options": {
                            "0": {
                                "label": "[Text]",
                                "value": false
                            },
                            "1": {
                                "label": "[Text]",
                                "value": false
                            }
                        }
                    }
                },
                "moveTypes": {
                    "basic": {
                        "label": "Basic Moves",
                        "moves": [],
                        "creation": true
                    },
                    "playbook": {
                        "label": "Playbook Moves",
                        "moves": [],
                        "playbook": true
                    },
                    "team": {
                        "label": "Team Moves",
                        "moves": [],
                        "playbook": true
                    },
                    "adult": {
                        "label": "Adult Moves",
                        "moves": []
                    }
                }
            },
            "npc": {
                "attrTop": {
                    "realName": {
                        "label": "Real Name",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "Text",
                        "value": ""
                    }
                },
                "attrLeft": {
                    "conditions": {
                        "label": "Conditions",
                        "description": "Choose all that apply:",
                        "customLabel": false,
                        "userLabel": false,
                        "type": "ListMany",
                        "condition": false,
                        "options": {
                            "0": {
                                "label": "Afraid",
                                "value": false
                            },
                            "1": {
                                "label": "Angry",
                                "value": false
                            },
                            "2": {
                                "label": "Guilty",
                                "value": false
                            },
                            "3": {
                                "label": "Hopeless",
                                "value": false
                            },
                            "4": {
                                "label": "Insecure",
                                "value": false
                            }
                        }
                    },
                    "drive": {
                        "label": "Drive",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "LongText",
                        "value": ""
                    },
                    "abilities": {
                        "label": "Abilities",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "LongText",
                        "value": ""
                    },
                    "generation": {
                        "label": "Generation",
                        "description": null,
                        "customLabel": false,
                        "userLabel": false,
                        "type": "Text",
                        "value": ""
                    }
                },
                "moveTypes": {
                    "villain": {
                        "label": "Villain Moves",
                        "moves": []
                    },
                    "condition": {
                        "label": "Condition Moves",
                        "moves": []
                    }
                }
            }
        }
    }
};