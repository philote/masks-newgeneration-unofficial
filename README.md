![Cover](images/cover.webp)

<p align="center">
    <img alt="Foundry Version 14 support" src="https://img.shields.io/badge/Foundry-v14-informational">
    <img alt="Latest Release Download Count" src="https://img.shields.io/github/downloads/philote/masks-newgeneration-unofficial/latest/total"> 
    <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/philote/masks-newgeneration-unofficial"> 
    <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/philote/masks-newgeneration-unofficial">
</p>
<p align="center">
    <img alt="GitHub" src="https://img.shields.io/github/license/philote/masks-newgeneration-unofficial"> 
    <a href="https://github.com/philote/masks-newgeneration-unofficial/issues">
        <img alt="GitHub issues" src="https://img.shields.io/github/issues/philote/masks-newgeneration-unofficial">
    </a> 
    <a href="https://github.com/philote/masks-newgeneration-unofficial/network">
        <img alt="GitHub forks" src="https://img.shields.io/github/forks/philote/masks-newgeneration-unofficial">
    </a> 
    <a href="https://github.com/philote/masks-newgeneration-unofficial/stargazers">
        <img alt="GitHub stars" src="https://img.shields.io/github/stars/philote/masks-newgeneration-unofficial">
    </a>
</p>

The content from this module is from **Masks: A New Generation** from **Magpie Games**. You can get the PDF at: https://magpiegames.com/masks/

This revised version of the module is based on works from multiple people: 
- The original created by brunocalado (https://github.com/brunocalado/masks-newgeneration-unofficial) 
- A second version that was maintained by CyricPL (https://github.com/CyricPL/masks-newgeneration-unofficial)
- A sheet module created by Geekswordsman (https://gitlab.com/geekswordsman/masks-newgeneration-sheets)
- Further development and Spanish translation added by erizocosmico
- French translation added by sedric, based on the official translation by Guy Blavin for 500 Nuances de Geek
- Continued maintenance through Foundry v13 by philote (ephson)

The current version is a merging of these modules' features, cleanup of the moves and bringing the module up to date with Foundry VTT versions and PbtA system versions.

The module is maintained by [ctincorvia](https://github.com/ctincorvia) as of the 2.x releases, which added Foundry v14 support. Thanks to [philote](https://github.com/philote) for handing the project over and for the years of maintenance that got it here.

## Screenshots
![A screenshot of the Masks character sheet in light mode](images/screenshots/character-sheet_light.webp)
![A screenshot of the Masks character sheet in dark mode](images/screenshots/character-sheet_dark.webp)
![A screenshot of the Masks NPC sheet in light mode](images/screenshots/npc-sheet_light.webp)

## Dependencies
The following Foundry VTT game system must be installed to use this module: [Powered by the Apocalypse](https://github.com/asacolips-projects/pbta).

> [!WARNING]
> ### Masks V2.0+
> **ONLY** works with Foundry v14+ and PbtA v1.2.0+
#### If you use Foundry v13:
- use PbtA [v1.1.23](https://github.com/asacolips-projects/pbta/releases/tag/1.1.23) with Masks [v1.8.x](https://github.com/philote/masks-newgeneration-unofficial/releases)
#### If you use Foundry v12: 
- use PbtA [v1.1.15.2](https://github.com/asacolips-projects/pbta/releases/tag/1.1.15.2) with Masks [v1.7.6](https://github.com/philote/masks-newgeneration-unofficial/releases/tag/1.7.6)
#### If you use Foundry v11: 
- use PbtA [v0.9.7](https://github.com/asacolips-projects/pbta/releases/tag/0.9.7) with Masks [v1.6.3](https://github.com/philote/masks-newgeneration-unofficial/releases/tag/1.6.3)

## Features
- PC and NPC character sheets, with an improved layout and Social and Advancement tabs
- Compendium of moves and playbooks
- Easy Label switching and better description fields
- Most playbooks have unique attributes to track, once they are added to the character sheet
- Improved Influences interface
- Automation for playbooks

### Rolling & move automation
- **Conditions apply themselves.** Each move knows which condition penalizes it — the roll dialog marks and locks that one and hides the rest, so nobody has to remember which condition hits which move or mis-applies one.
- **"Take a Powerful Blow" and "Burn" count conditions correctly** — these roll *+ conditions marked* rather than taking the usual -2 each, and the dialog now does that automatically.
- **The roll dialog is skipped when there's nothing to decide.** It only appears when you actually have a choice to make — a Label to pick, forward/ongoing/hold to spend, or tokens to use.
- **A "Mark Potential" button appears on the chat card** whenever a miss tells you to mark Potential. One click, visible only to the character's owner and the GM, greyed out once Potential is full, and it disappears once used so it can't be double-clicked.
- **Moves that fold several rolls into one now ask which you're making** — "Connecting the Dots" and "All the Best Stuff" prompt for the roll you want instead of guessing.
- **Moves that let you roll a basic move under your own Label now ask which one** — "No Powers and Not Nearly Enough Training" and "Kirby-Craft" prompt, then show that basic move's results.
- **Playbook-specific Labels are rollable.** Moves that roll + a playbook's own Label (rather than one of the five core stats) now work directly, including playbooks whose Label is tracked as a grid of checkboxes rather than a single number.
- **Label-swap prompt.** Moves that grant it — currently the Soldier's "A Higher Calling" — offer to roll with that Label instead of the move's own, whenever it applies.

### Team Pool Tracker
- **A dedicated Team Pool sheet** with plus/minus controls and the current total shown in the actor's name, so it's readable straight from the sidebar.
- **Every player can spend from it**, not just the GM — it's shared by default.
- **A post-to-chat button** to announce the current pool to the table.

### Adding moves to a sheet
- **Picker dialogs instead of blank moves.** The "+" on Playbook Moves and Adult Moves now offers a list to choose from — moves from your own playbook, from another playbook, or the five core-book adult moves — instead of creating an empty move to fill in by hand.

### Look & feel
- **Dark mode is per-player** and applies instantly, instead of being a world-wide setting that needed a reload. Each player picks their own.
- **Five dark palettes:** Midnight Indigo (the default), Noir Teal, Deep Navy, Graphite, and Auburn — the previous reddish look, still available.
- **Five light palettes:** Daylight (the original look, still the default), Dusk, Verdant, Overcast, and Ink.
- **Follows Foundry's own dark mode.**
- **Chat cards and the chat pane restyled** in both light and dark — readable titles and subtitles, result links that wrap instead of overflowing, consistent move bullets and chips, and matching styling in the chat popout, notifications, and the new picker dialogs.

### Languages
- **French translation** by [sedric](https://github.com/sedric), based on the official 500 Nuances de Geek translation by Guy Blavin, with the publisher credit in the sidebar switching to 500 Nuances de Geek under French.
- **Spanish translation** by [erizocosmico](https://github.com/erizocosmico).
- **Spanish and French cover all the new features** above.
- **Fixed condition automation silently not working outside English** — it never fired in Spanish.

### Content fixes
- **The Nova playbook's Advancements list is fixed.**
- **Move text and roll setup corrected across the compendium** — including moves that used to list their options twice on a chat card, once as text and again as clickable choices.
- **Existing characters are updated automatically.** These corrections reach moves already on a character sheet, so nothing has to be deleted and re-added by hand.

## TODO
- Add influence to roll dialogs
- Common tracking of who has influence over who
- Figure out how to support the Joined better

# Install

## Module Directory
This module is listed in the Foundry module directory and can be searched and installed within the application.

## Manual Instalation
Go to **modules** and use this link: https://github.com/philote/masks-newgeneration-unofficial/releases/latest/download/module.json

# How To
1. Activate the module.
3. Import the compendium you want. Right click it and Import all Content.
4. Drag the Folder Basic and Adult to an Actor Sheet.

# More Instructions
There is a journal with more instructions inside the module. Load the module and search the compendiums for it.

# License
The entire text of Masks is released under a Creative Commons Attribution 4.0 International license. https://creativecommons.org/licenses/by/4.0/ \
This work uses material from The Innocent, published by Magpie Games in the Halcyon City Herald Collection and written by Brendan Conway, and is licensed under the Creative Commons Attribution 4.0 International license. http://creativecommons.org/licenses/by/4.0/ \
This work uses material from The Joined, published by Magpie Games in the Halcyon City Herald Collection and written by Jenn Martin, and is licensed under the Creative Commons Attribution 4.0 International license. http://creativecommons.org/licenses/by/4.0/ \
This work uses material from The Newborn, published by Magpie Games in the Halcyon City Herald Collection and written by Tim Franzke and Alberto Muti, and is licensed under the Creative Commons Attribution 4.0 International license. http://creativecommons.org/licenses/by/4.0/ \
This work uses material from The Reformed, published by Magpie Games in the Halcyon City Herald Collection and written by June Shores, and is licensed under the Creative Commons Attribution 4.0 International license. http://creativecommons.org/licenses/by/4.0/ \
This work uses material from The Star, published by Magpie Games in the Halcyon City Herald Collection and written by Brendan Conway, and is licensed under the Creative Commons Attribution 4.0 International license. http://creativecommons.org/licenses/by/4.0/ \
This work uses material from The Brain, published by Magpie Games in Secrets of AEGIS and written by Cam Banks, and is licensed under the Creative Commons Attribution 4.0 International license. http://creativecommons.org/licenses/by/4.0/ \
This work uses material from The Soldier, published by Magpie Games in Secrets of AEGIS and written by Mark Diaz Truman, and is licensed under the Creative Commons Attribution 4.0 International license. http://creativecommons.org/licenses/by/4.0/ \
This work uses material from The Harbinger, published by Magpie Games in Masks: Unbound and written by Fred Hicks, and is licensed under the Creative Commons Attribution 4.0 International license. http://creativecommons.org/licenses/by/4.0/ \
This work uses material from The Nomad, published by Magpie Games in Masks: Unbound and written by Brendan Conway, and is licensed under the Creative Commons Attribution 4.0 International license. http://creativecommons.org/licenses/by/4.0/ \
This work uses material from The Scion, published by Magpie Games in Masks: Unbound and written by Brendan Conway, and is licensed under the Creative Commons Attribution 4.0 International license. http://creativecommons.org/licenses/by/4.0/ \
Icons from game-icons.net are released under a Creative Commons Attribution 3.0 Unported license. https://creativecommons.org/licenses/by/3.0/ \
CSS for the light and dark themes came from https://gitlab.com/foundryvtt-mods/masks-newgeneration-sheets
