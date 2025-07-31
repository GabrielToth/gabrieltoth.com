# Resume Files

Place your resume files in this directory with the following names:

## English Resume
- **File name**: `Gabriel Toth - Curriculum EN.pdf`
- **Used when**: User visits any version of the site (except Portuguese)
- **Download button**: "Download Resume" / "Descargar CV" / "Lebenslauf herunterladen"

## Portuguese Resume (Currículo)
- **File name**: `Gabriel Toth - Curriculum PT.pdf`
- **Used when**: User visits Portuguese version of the site
- **Download button**: "Baixar Currículo"

## How it works
The download button automatically:
1. Detects the current locale
2. If locale is PT-BR, downloads the Portuguese resume
3. For all other locales, downloads the English resume

## File format
- Keep files as **PDF** format
- Use the exact filenames above
- Files will be publicly accessible at `/resume/filename.pdf` 
