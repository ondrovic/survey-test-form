#!/usr/bin/env node

/**
 * Console Statement Cleanup Script
 * 
 * This script systematically removes debugging console.log statements 
 * and ensures console.error statements are properly routed to error logging service.
 * 
 * Usage: node cleanup-console-statements.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const srcDir = './src';
const patterns = {
    // Debugging console.log patterns to remove (with emoji indicators)
    debugLogs: [
        /console\.log\s*\(\s*['"`]🔍.*?['"`].*?\);?/gs,
        /console\.log\s*\(\s*['"`]🚀.*?['"`].*?\);?/gs,
        /console\.log\s*\(\s*['"`]✅.*?['"`].*?\);?/gs,
        /console\.log\s*\(\s*['"`]❌.*?['"`].*?\);?/gs,
        /console\.log\s*\(\s*['"`]📊.*?['"`].*?\);?/gs,
        /console\.log\s*\(\s*['"`]🔄.*?['"`].*?\);?/gs,
        /console\.log\s*\(\s*['"`]🔧.*?['"`].*?\);?/gs,
        /console\.log\s*\(\s*['"`]🚨.*?['"`].*?\);?/gs,
        // Generic debugging patterns
        /console\.log\s*\(\s*['"`].*?Debug.*?['"`].*?\);?/gs,
        /console\.log\s*\(\s*['"`].*?debug.*?['"`].*?\);?/gs,
        // App.tsx specific patterns
        /console\.log\s*\(\s*['"`]App - .*?['"`].*?\);?/gs,
        /console\.log\s*\(\s*['"`]Framework Initialization.*?['"`].*?\);?/gs,
    ],
    
    // console.error patterns that should be replaced with error logging
    errorLogs: [
        // Pattern: console.error followed by ErrorLoggingService call
        /console\.error\s*\([^)]+\);\s*\n\s*await ErrorLoggingService\.logError\s*\(\s*\{/g,
        /console\.error\s*\([^)]+\);\s*\n\s*\n\s*await ErrorLoggingService\.logError\s*\(\s*\{/g,
    ]
};

// Files to exclude from cleanup
const excludePatterns = [
    '**/error-logging.service.ts', // Keep console.error in the logging service itself
    '**/error-logging.utils.ts',   // Keep console.error in utils
    '**/console.utils.ts',         // Keep console utilities
    '**/*.test.ts',                // Keep test console statements
    '**/*.spec.ts',                // Keep test console statements
];

// Legitimate console.log patterns to preserve
const preservePatterns = [
    /console\.log\s*\(\s*['"`]🔓 Clearing validation locks\.\.\.['"`]\s*\);?/g,
    /console\.log\s*\(\s*['"`]✅ Validation locks cleared:['"`].*?\);?/g,
];

async function findFiles() {
    return new Promise((resolve, reject) => {
        glob(`${srcDir}/**/*.{ts,tsx}`, { ignore: excludePatterns }, (err, files) => {
            if (err) reject(err);
            else resolve(files);
        });
    });
}

function isLegitimateLog(content, match) {
    // Check if this console.log should be preserved
    for (const pattern of preservePatterns) {
        if (pattern.test(match)) {
            return true;
        }
    }
    return false;
}

function cleanupFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let changes = [];

    // Remove debugging console.log statements
    for (const pattern of patterns.debugLogs) {
        const matches = content.match(pattern);
        if (matches) {
            for (const match of matches) {
                if (!isLegitimateLog(content, match)) {
                    newContent = newContent.replace(match, '');
                    changes.push(`Removed debug log: ${match.substring(0, 50)}...`);
                }
            }
        }
    }

    // Replace console.error patterns that are followed by ErrorLoggingService
    for (const pattern of patterns.errorLogs) {
        const originalContent = newContent;
        newContent = newContent.replace(pattern, 'await ErrorLoggingService.logError({');
        if (newContent !== originalContent) {
            changes.push('Removed redundant console.error before ErrorLoggingService call');
        }
    }

    // Clean up multiple empty lines
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        return changes;
    }

    return [];
}

async function main() {
    console.log('🧹 Starting console statement cleanup...');
    
    try {
        const files = await findFiles();
        console.log(`📁 Found ${files.length} TypeScript files to process`);

        let totalChanges = 0;
        const fileResults = [];

        for (const file of files) {
            const changes = cleanupFile(file);
            if (changes.length > 0) {
                totalChanges += changes.length;
                fileResults.push({
                    file: path.relative(process.cwd(), file),
                    changes: changes.length,
                    details: changes
                });
                console.log(`✅ ${path.relative(process.cwd(), file)}: ${changes.length} changes`);
            }
        }

        console.log('\n📊 Summary:');
        console.log(`- Files processed: ${files.length}`);
        console.log(`- Files modified: ${fileResults.length}`);
        console.log(`- Total changes: ${totalChanges}`);

        if (fileResults.length > 0) {
            console.log('\n📋 Detailed Changes:');
            fileResults.forEach(result => {
                console.log(`\n${result.file}:`);
                result.details.forEach(detail => {
                    console.log(`  - ${detail}`);
                });
            });
        }

        console.log('\n✅ Console statement cleanup completed!');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { cleanupFile, patterns };