#Unreleased
- Dark mode now offers five color palettes, picked per-player from the new "Dark Mode Theme" setting: Midnight Indigo, Noir Teal, Deep Navy, Graphite, and Auburn
- **Dark mode now defaults to Midnight Indigo.** The previous reddish palette is still available — choose "Auburn (classic)" in the new dropdown to get it back
- Switching dark mode or its palette now takes effect immediately instead of requiring a reload

#2.0.4
- Added a French translation (sedric, based on the official translation by Guy Blavin for 500 Nuances de Geek)
- The publisher link in the Settings sidebar is now localized, crediting 500 Nuances de Geek under French and Magpie Games otherwise
- Fixed automatic condition-checkbox lockdown on basic move rolls under non-English locales — it silently never applied under Spanish, and would have under French too

#2.0.3
- Added a Label-swap prompt: moves that grant it (currently the Soldier's "A Higher Calling") let you roll with that flagged attribute's Label instead of the move's own
- Added a roll-options picker for moves that fold multiple distinct rolls into one item ("Connecting the Dots", "All the Best Stuff")
- Added attribute-based rolls for playbook-specific Labels that aren't one of the five core stats
- Extended chat card and dialog styling fixes to the chat popout and notifications windows, and added styling for the new roll-options/label-swap dialogs
- Existing actors' items for the moves above are automatically migrated to the new mechanics

#2.0.2
- Fixed dark mode contrast for chat card titles and subtitles
- Fixed chat card result links to wrap correctly instead of overflowing

#2.0.1
- Updated styling for chat panes (light and dark mode)

#2.0.0
- New maintainer as of this release (ctincorvia), after the previous maintainer became unreachable — see README for the full lineage
- Added a Team Pool Tracker sheet
- Added an automatic Mark Potential button that appears when a move result calls for it
- Added move picker dialogs for playbook, basic, and adult moves, and automatic condition application based on move results
- Rolls with no choices to make now skip the roll dialog automatically
- Foundry v14 support added
- This version ONLY works with Foundry v14+ and PbtA v1.2.0+
- Namespaced deprecated globals (`loadTemplates`, `Actors`) ahead of their v15 removal
- Removed the dead Foundry v12 branch from the settings sidebar integration
- Removed unused TinyMCE styling (TinyMCE was removed from Foundry in v13; ProseMirror is now the only editor)
- Fixed the login screen background never actually applying, due to an inverted response check
- Removed the in-app Ko-fi/donation link tied to the previous maintainer's personal account
- If you use Foundry v13:
    - use PbtA v1.1.23 with Masks v1.8.x
- If you use Foundry v12: 
    - use PbtA v1.1.15 with Masks v1.7.6
- If you use Foundry v11: 
    - use PbtA v0.9 with Masks v1.6.3

#1.7.6
- @ryzimmer fixed an issue that breaks when trying to add influences on new character/when undefined

#1.7.5
- fixed a bug with the new login screen code
- updated project files
- fixed text for for setting up CUB (from Proffcake on Discord)

#1.7.2
- Added item granting from playbooks when a playbook is added to a character

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
