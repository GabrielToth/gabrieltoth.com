/* c8 ignore next - maintenance script */
const fs = require('fs')
const path = require('path')

const locales = ['en', 'pt-BR', 'es', 'de', 'fr']
const basePath = path.join(__dirname, '..', 'src', 'i18n')

for (const locale of locales) {
  const filePath = path.join(basePath, locale, 'editors.json')
  const raw = fs.readFileSync(filePath, 'utf8')
  const data = JSON.parse(raw)
  const jp = data.structuredData.jobPosting

  // Add missing address fields for remote job
  if (jp.jobLocation && jp.jobLocation.address) {
    jp.jobLocation.address.addressLocality = 'REMOTE'
    jp.jobLocation.address.streetAddress = 'N/A'
    jp.jobLocation.address.postalCode = 'N/A'
  }

  // Add validThrough (required by Google)
  jp.validThrough = '2027-12-31T23:59:59Z'

  // Add value field to baseSalary.value (QuantitativeValue requires a number value)
  if (jp.baseSalary && jp.baseSalary.value && !jp.baseSalary.value.value) {
    jp.baseSalary.value.minValue = 0
    jp.baseSalary.value.maxValue = 10000
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated: ${filePath}`)
}

console.log('All editors.json files updated successfully.')
