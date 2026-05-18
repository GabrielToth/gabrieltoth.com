const fs = require("fs")
const file = "src/app/api/auth/login/route.test.ts"
let code = fs.readFileSync(file, "utf8")

// Replace standard bcrypt hashes with peppered ones
code = code.replace(/const hashedPassword = await bcrypt\.hash\("Test@1234", 10\)/g, 
    "const { getSecurityConfig } = await import(\"@/lib/auth/password-security\")\n        const pepper = getSecurityConfig().pepper\n        const hashedPassword = await bcrypt.hash(\"Test@1234\" + pepper, 10)")

// Check if it's there for invalid password
code = code.replace(/password_hash: await bcrypt\.hash\("Test@1234", 10\)/g,
    "password_hash: await bcrypt.hash(\"Test@1234\" + (await import(\"@/lib/auth/password-security\")).getSecurityConfig().pepper, 10)")

fs.writeFileSync(file, code)
console.log("Replaced")
