#!/usr/bin/env node

/**
 * Generate drum machine configuration
 * Scans all drum machines and creates sample file mappings
 */

const fs = require('fs');
const path = require('path');

const drumsDir = path.join(__dirname, 'samples', 'drums');
const machines = fs.readdirSync(drumsDir).filter(f => {
    const stat = fs.statSync(path.join(drumsDir, f));
    return stat.isDirectory();
}).sort();

console.log(`Found ${machines.length} drum machines\n`);

// Generate drumMachinesAvailable array
console.log('=== DRUM MACHINES AVAILABLE ===');
console.log('drumMachinesAvailable: [');
machines.forEach(machine => {
    console.log(`    '${machine}',`);
});
console.log('],\n');

// Generate drumFileMap
console.log('=== DRUM FILE MAP ===');
console.log('const drumFileMap = {');

machines.forEach(machine => {
    const machinePath = path.join(drumsDir, machine);
    const prefix = machine.toLowerCase();

    // Find sample folders
    const folders = fs.readdirSync(machinePath).filter(f => {
        return fs.statSync(path.join(machinePath, f)).isDirectory();
    });

    // Map common drum types to their folders
    const drumTypes = {
        'bd': 'kick',
        'sd': 'snare',
        'hh': 'hihat',
        'oh': 'openhat',
        'cp': 'clap',
        'rim': 'rim',
        'cb': 'cowbell',
        'cr': 'crash',
        'ht': 'tom1',
        'mt': 'tom2',
        'lt': 'tom3',
        'rd': 'ride',
        'tb': 'tambourine'
    };

    const samples = {};

    // Find samples for each drum type
    Object.keys(drumTypes).forEach(abbrev => {
        const drumFolder = folders.find(f => f.includes(`-${abbrev}`));
        if (drumFolder) {
            const drumPath = path.join(machinePath, drumFolder);
            const files = fs.readdirSync(drumPath).filter(f =>
                f.toLowerCase().endsWith('.wav')
            );
            if (files.length > 0) {
                samples[drumTypes[abbrev]] = files[0]; // Use first file
            }
        }
    });

    // Output mapping if we found samples
    if (Object.keys(samples).length >= 4) { // At least kick, snare, hihat, openhat
        console.log(`    '${machine}': {`);
        Object.keys(samples).forEach(key => {
            console.log(`        ${key}: '${samples[key]}',`);
        });
        console.log(`    },`);
    } else {
        console.log(`    // '${machine}': { /* NEEDS MANUAL MAPPING */ },`);
    }
});

console.log('};');

// Also output just the machine names in a cleaner format
console.log('\n=== MACHINE NAMES (for UI) ===');
machines.forEach(machine => {
    const displayName = machine.replace(/([A-Z])/g, ' $1').trim();
    console.log(`${machine}: "${displayName}"`);
});
