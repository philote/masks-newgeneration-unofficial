#1.7.1
- Fixed buts in the Team question, Relationship questions, Moment of truth, and advances (they were not saving)

#1.7.0
- Foundry v12 Only release
- [ Breaking ] Attributes were changed for Relationship Questions, Momentum, and the Team Question, and Hero Name (became Real name)
- Updated Playbooks to add auto add attributes to the character
- Added Social and Advancement tabs for a cleaner layout
- Moved Real Name to the top bar
- Moved Forward and Ongoing to the top attribute bar
Notes: 
- Only works with Foundry v12+ and PbtA v1+
- If you need Foundry v11 or PbtA v0.9 support then use Masks v1.6.3

#1.6.3
- PbtA version update

#1.6.2
- fixed a bug with a setting not existing in older versions of pbta

#1.6.1
- Foundry v12 fixes
- fix a possible issue with pbta version

#1.5.8
- Fixed a bug with making new influences

#1.5.7
- Migrated from custom label shifting to using the on built into the PbtA system

#1.5.4
- New release process to get packs out of git. From now on people will need to use `npm run pullJSONtoLDB` to get packs locally.

#1.5.3
- Update the moves to not use the "choices" UI in the PbtA system as it doesnt work well for Masks

#1.5.2
- updated all the playbooks with new layouts and info
- NPC sheet clean up

#1.5.1
- character sheet Layout updates

#1.5.0
- This is the 1st release after @philote took over the repo.
- Light and Dark Themes for the sheets
- Compendium of Moves & Playbooks
- Influence tracking tab
- Playbook specific UI when a Playbook is chosen (except for the Joined, since they take on any special rules for whomever they join with)
- Label shifting UI on the Character Sheets (there is a setting to hide it)
- Description tab has multiple sections

#1.4.2
- Easy Label switching (can be turned on and off in the settings)
- Better Descriptions fields
- Most playbooks have unique attributes to track when chosen on the character sheet
- Hid the EQ tab
- Sheet Config clean up (added all the strings to en.json)
- Basic moves are auto added to new character sheets

#1.4.1
- Cleaned up the Basic Moves & Basic Playbook Moves (all others to come)
- Added code to automatically add Basic Moves to a character sheet when it is created

#1.4.0
- Added Light and Dark themes. CSS used from https://gitlab.com/foundryvtt-mods/masks-newgeneration-sheets
- updated the readme with screenshots

#1.3.2
- Tested with the PbtA module version 0.9.0.
- Fixed a bug where Basic Playbooks would show twice in the playbook dropdown.

#1.3.1
- added roll modifier min/max values

#1.3.0
- Updated the compendiums to be Foundry V11 compatible. This also removes the requirement for the Compendium Folders module and means this version of this module is not compatible with Foundry V10 or lower.

#1.2.0
- added function to define system character sheet TOML from within module

#1.0.0
- added playbooks from Unbound in compendium Unbound Playbooks - thanks to Prof. Hidgens#9914 on Discord!
- changed the icon for The Protege's Captain move to not be redundant with The Soldier's More than Just a Shield move

#0.1.9
- added playbooks from Secrets of AEGIS in compendium AEGIS Playbooks

#0.1.8
- bug fixes for HCHC Playbooks

#0.1.7
- shift labels macro bug fix

#0.1.6
- bug fix

#0.1.5
- bug fix

#0.1.4
- added playbooks from Halcyon City Herald Collection in compendium HCHC Playbooks

#0.1.3
- validated v9 compatibility

#0.1.2
- first version of revised module
- version numbering aligned with versions on original module
