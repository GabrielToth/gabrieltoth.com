const fs = require('fs');
const path = require('path');

const files = [
  'src/i18n/fr/publish.json',
  'src/i18n/fr/pcOptimization.json',
  'src/i18n/fr/minecraft.json'
];

const translations = {
  'Publish': 'Publier',
  'Publishing': 'Publication',
  'Dashboard': 'Tableau de bord',
  'Step': 'Étape',
  'of': 'sur',
  'Next': 'Suivant',
  'Back': 'Retour',
  'Cancel': 'Annuler',
  'Now': 'Maintenant',
  'Select': 'Sélectionner',
  'Upload': 'Téléverser',
  'Download': 'Télécharger',
  'Create': 'Créer',
  'Add': 'Ajouter',
  'Remove': 'Retirer',
  'Update': 'Mettre à jour',
  'Continue': 'Continuer',
  'Previous': 'Précédent',
  'Submit': 'Soumettre',
  'Schedule': 'Programmer',
  'Content': 'Contenu',
  'Platform': 'Plateforme',
  'Platforms': 'Plateformes',
  'Title': 'Titre',
  'Description': 'Description',
  'Tags': 'Tags',
  'Video': 'Vidéo',
  'Image': 'Image',
  'Post': 'Publication',
  'Channel': 'Chaîne',
  'Channels': 'Chaînes',
  'Live': 'En direct',
  'Insights': 'Analyses'
};

function translateValue(val) {
  if (typeof val !== 'string') return val;
  let result = val;
  for (const [en, fr] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${en}\\b`, 'g');
    result = result.replace(regex, fr);
  }
  return result;
}

function translateObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(translateObject);
  }
  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = translateObject(value);
    }
    return result;
  }
  return translateValue(obj);
}

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    const translated = translateObject(content);
    fs.writeFileSync(file, JSON.stringify(translated, null, 4));
    console.log(`✓ Translated ${path.basename(file)}`);
  }
});

// Translate questions
const questionsDir = 'src/i18n/fr/questions';
if (fs.existsSync(questionsDir)) {
  const questionFiles = fs.readdirSync(questionsDir);
  questionFiles.forEach(file => {
    const filePath = path.join(questionsDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const translated = translateObject(content);
    fs.writeFileSync(filePath, JSON.stringify(translated, null, 4));
    console.log(`✓ Translated questions/${file}`);
  });
}

console.log('All files translated!');
