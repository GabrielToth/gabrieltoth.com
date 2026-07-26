#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];
const I18N_DIR = path.join(__dirname, '../src/i18n');
const REFERENCE_LANG = 'en';

let hasErrors = false;

function extractParams(str) {
    const matches = str.match(/\{[^}]+\}/g) || [];
    return matches.sort();
}

function flattenKeys(obj, prefix = '') {
    const result = {};
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(result, flattenKeys(obj[key], fullKey));
        } else {
            result[fullKey] = obj[key];
        }
    }
    return result;
}

function validateFile(fileName) {
    console.log(`\n🔍 Validating: ${fileName}`);
    
    const files = {};
    const flattenedKeys = {};
    
    for (const lang of LANGUAGES) {
        const filePath = path.join(I18N_DIR, lang, fileName);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Missing file: ${lang}/${fileName}`);
            hasErrors = true;
            return;
        }
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            files[lang] = JSON.parse(content);
            flattenedKeys[lang] = flattenKeys(files[lang]);
        } catch (error) {
            console.error(`❌ Failed to parse ${lang}/${fileName}: ${error.message}`);
            hasErrors = true;
            return;
        }
    }
    
    const refKeys = flattenedKeys[REFERENCE_LANG];
    const refKeySet = new Set(Object.keys(refKeys));
    
    for (const lang of LANGUAGES) {
        if (lang === REFERENCE_LANG) continue;
        
        const langKeys = flattenedKeys[lang];
        const langKeySet = new Set(Object.keys(langKeys));
        
        const missing = [...refKeySet].filter(k => !langKeySet.has(k));
        const extra = [...langKeySet].filter(k => !refKeySet.has(k));
        
        if (missing.length > 0) {
            console.error(`❌ [${lang}] Missing keys:`);
            missing.forEach(k => console.error(`   - ${k}`));
            hasErrors = true;
        }
        
        if (extra.length > 0) {
            console.error(`❌ [${lang}] Extra keys (not in ${REFERENCE_LANG}):`);
            extra.forEach(k => console.error(`   - ${k}`));
            hasErrors = true;
        }
        
        for (const key of refKeySet) {
            if (!langKeySet.has(key)) continue;
            
            const refValue = refKeys[key];
            const langValue = langKeys[key];
            
            if (typeof refValue !== typeof langValue) {
                console.error(`❌ [${lang}] Type mismatch for key "${key}": ${REFERENCE_LANG} has ${typeof refValue}, ${lang} has ${typeof langValue}`);
                hasErrors = true;
                continue;
            }
            
            if (typeof refValue === 'string') {
                const refParams = extractParams(refValue);
                const langParams = extractParams(langValue);
                
                if (refParams.length !== langParams.length || refParams.join(',') !== langParams.join(',')) {
                    console.error(`❌ [${lang}] Parameter mismatch for key "${key}":`);
                    console.error(`   ${REFERENCE_LANG}: ${refParams.join(', ') || '(none)'}`);
                    console.error(`   ${lang}: ${langParams.join(', ') || '(none)'}`);
                    hasErrors = true;
                }
            }
        }
    }
    
    if (!hasErrors) {
        console.log(`✅ All translations valid for ${fileName}`);
    }
}

function main() {
    console.log('🌍 i18n Validation Script');
    console.log(`📂 Scanning: ${I18N_DIR}`);
    console.log(`📝 Languages: ${LANGUAGES.join(', ')}`);
    console.log(`🔑 Reference language: ${REFERENCE_LANG}`);
    
    const refDir = path.join(I18N_DIR, REFERENCE_LANG);
    if (!fs.existsSync(refDir)) {
        console.error(`❌ Reference language directory not found: ${refDir}`);
        process.exit(1);
    }
    
    const refFiles = fs.readdirSync(refDir).filter(f => f.endsWith('.json'));
    
    console.log(`\n📄 Found ${refFiles.length} translation files in ${REFERENCE_LANG}/`);
    
    for (const lang of LANGUAGES) {
        const langDir = path.join(I18N_DIR, lang);
        if (!fs.existsSync(langDir)) {
            console.error(`❌ Language directory not found: ${langDir}`);
            hasErrors = true;
        }
    }
    
    if (hasErrors) {
        console.error('\n❌ Pre-flight checks failed. Fix directory structure first.');
        process.exit(1);
    }
    
    for (const fileName of refFiles) {
        validateFile(fileName);
    }
    
    if (hasErrors) {
        console.error('\n❌ i18n validation FAILED. Fix the errors above.');
        process.exit(1);
    } else {
        console.log('\n✅ All i18n translations are valid and synchronized!');
        process.exit(0);
    }
}

main();
