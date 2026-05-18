const fs = require("fs")
const file = "src/app/api/auth/login/route.test.ts"
let code = fs.readFileSync(file, "utf8")

// Add captchaToken to test requests
code = code.replace(/csrfToken: "token"/g, "csrfToken: \"token\",\n                captchaToken: \"valid-token\"")

// For tests that don't have csrfToken: "token"
code = code.replace(/password: "Test@1234",\n            }\)/g, "password: \"Test@1234\",\n                captchaToken: \"valid-token\",\n            })")

// For "WrongPassword" without csrfToken matches (if any)
code = code.replace(/password: "WrongPassword",\n                csrfToken/g, "password: \"WrongPassword\",\n                captchaToken: \"valid-token\",\n                csrfToken")

fs.writeFileSync(file, code)
console.log("Replaced")
