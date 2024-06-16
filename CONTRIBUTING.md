# Contributing

This module is under the MIT license and is accepting merge requests and issue reports. Feel free to submit improvements to the module, and I'll review them and merge them if they seem useful for the module.

# How to use the system locally

With the change to LevelDB, there is an extra step to create the packs locally.

- Clone the repository as usual
- You need to have a node.js installation done
- You must be in Foundry welcome page (or have it completely closed) and NOT in a world. In the system directory, do : 
    - npm install will generate the node_modules depending on package.json and package-lock.json
    - npm run pullJSONtoLDB will create the packs depending of the content of src/packs directory

# To update the packs
Make sure Foundry is not running first.
-  LDB to JSON for syncing to git : npm run pushLDBtoJSON will create the src/packs files and export all actors/items in json files
-  JSON to LDB for testing locally : npm run pullJSONtoLDB will create the LevelDB folders from the JSON files in the src/packs folder