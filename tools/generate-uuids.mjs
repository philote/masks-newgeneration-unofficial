#!/usr/bin/env node

import { randomBytes } from 'crypto';
import { readdir, readFile, writeFile, rename, unlink } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate a 16-character alphanumeric UUID
function generate16CharUUID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const bytes = randomBytes(16);
    
    for (let i = 0; i < 16; i++) {
        result += chars[bytes[i] % chars.length];
    }
    
    return result;
}

// Check if an ID is a valid 16-character alphanumeric UUID
function isValid16CharUUID(id) {
    if (!id || id.length !== 16) return false;
    const validChars = /^[A-Za-z0-9]+$/;
    // Also exclude common patterns that aren't proper UUIDs
    const invalidPatterns = [/\d{3}$/, /^[A-Z][a-z]+/]; // ends with 3 digits, starts with capitalized word
    return validChars.test(id) && !invalidPatterns.some(pattern => pattern.test(id));
}

// Process a single JSON file
async function processFile(filePath) {
    try {
        console.log(`Checking: ${filePath}`);
        
        // Read and parse the JSON file
        const content = await readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Check if ID is already valid AND filename contains the UUID
        const filename = basename(filePath);
        const hasUUIDInFilename = filename.includes(data._id);
        
        if (isValid16CharUUID(data._id) && hasUUIDInFilename) {
            console.log(`  Skipping - already has valid UUID and filename: ${data._id}`);
            return;
        }
        
        if (isValid16CharUUID(data._id) && !hasUUIDInFilename) {
            console.log(`  Processing - UUID valid but filename needs update: ${data._id}`);
        } else {
            console.log(`  Processing - invalid ID: ${data._id}`);
        }
        
        // Use existing UUID if valid, otherwise generate new one
        const newUUID = isValid16CharUUID(data._id) ? data._id : generate16CharUUID();
        
        // Update the JSON data
        const oldId = data._id;
        data._id = newUUID;
        data._key = `!items!${newUUID}`;
        
        // Generate new filename BEFORE writing
        const dir = dirname(filePath);
        const oldFilename = basename(filePath);
        let newFilename;
        
        if (oldFilename.includes(oldId)) {
            // Replace old ID in filename
            newFilename = oldFilename.replace(oldId, newUUID);
        } else {
            // Check if filename has any 16-character pattern (including placeholders)
            const nameWithoutExt = oldFilename.replace('.json', '');
            const uuidPattern = /_[A-Za-z0-9]{16}$/;
            const placeholderPattern = /_(AAAAAAAAAAAAAAAA|BBBBBBBBBBBBBBBB|CCCCCCCCCCCCCCCC|DDDDDDDDDDDDDDDD|EEEEEEEEEEEEEEEE|FFFFFFFFFFFFFFFF|GGGGGGGGGGGGGGGG|HHHHHHHHHHHHHHHH|IIIIIIIIIIIIIIII|JJJJJJJJJJJJJJJJ|KKKKKKKKKKKKKKKK|LLLLLLLLLLLLLLLL|MMMMMMMMMMMMMMMM|NNNNNNNNNNNNNNNN|OOOOOOOOOOOOOOOO|PPPPPPPPPPPPPPPP|QQQQQQQQQQQQQQQQ|RRRRRRRRRRRRRRRR|SSSSSSSSSSSSSSSS|TTTTTTTTTTTTTTTT|UUUUUUUUUUUUUUUU|VVVVVVVVVVVVVVVV|WWWWWWWWWWWWWWWW|XXXXXXXXXXXXXXXX|YYYYYYYYYYYYYYYY|ZZZZZZZZZZZZZZZZ|PLACEHOLDER_16_[A-Za-z0-9]{16})$/;
            
            if (placeholderPattern.test(nameWithoutExt)) {
                // Replace placeholder UUID with proper UUID
                newFilename = nameWithoutExt.replace(placeholderPattern, `_${newUUID}`) + '.json';
            } else if (uuidPattern.test(nameWithoutExt)) {
                // Replace existing UUID with new UUID
                newFilename = nameWithoutExt.replace(uuidPattern, `_${newUUID}`) + '.json';
            } else {
                // Add UUID to filename if it doesn't contain any ID
                newFilename = `${nameWithoutExt}_${newUUID}.json`;
            }
        }
        
        const newFilePath = join(dir, newFilename);
        const updatedContent = JSON.stringify(data, null, 2);
        
        // Write to the correct final path
        if (oldFilename !== newFilename) {
            // Write to new location and remove old file
            await writeFile(newFilePath, updatedContent, 'utf8');
            // Delete the old file
            await unlink(filePath);
            console.log(`  Renamed: ${oldFilename} -> ${newFilename}`);
        } else {
            await writeFile(filePath, updatedContent, 'utf8');
        }
        
        console.log(`  Updated ID: ${oldId} -> ${newUUID}`);
        
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Process all JSON files in a directory
async function processDirectory(dirPath) {
    try {
        const files = await readdir(dirPath);
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = join(dirPath, file);
                await processFile(filePath);
            }
        }
    } catch (error) {
        console.error(`Error processing directory ${dirPath}:`, error.message);
    }
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // Process specific files provided as arguments
        console.log('Processing specific files:');
        for (const filePath of args) {
            const absolutePath = join(process.cwd(), filePath);
            await processFile(absolutePath);
        }
        console.log('\nSpecified files have been processed!');
    } else {
        // Process all pack directories (original behavior)
        const packsDir = join(__dirname, '..', 'src', 'packs');
        
        try {
            const packDirs = await readdir(packsDir);
            
            for (const packDir of packDirs) {
                const packPath = join(packsDir, packDir);
                console.log(`\nProcessing pack directory: ${packDir}`);
                await processDirectory(packPath);
            }
            
            console.log('\nAll pack items have been updated with 16-character UUIDs!');
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
}

main();