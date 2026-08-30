import { createClient } from "@supabase/supabase-js"

/**
 * Script to grant R$ 1000 in credits to specified email
 * Usage: node scripts/grant-credits.js [email] [amount]
 */
async function main() {
    const targetEmail = process.argv[2] || "Matthausmattheyc@gmail.com"
    const amount = Number(process.argv[3]) || 1000

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
        console.error(
            "Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in env."
        )
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    console.log(`Searching user with email: ${targetEmail}...`)
    const { data: usersData, error: listError } =
        await supabase.auth.admin.listUsers()

    if (listError) {
        console.error("Failed to list users:", listError.message)
        process.exit(1)
    }

    const user = usersData.users.find(
        u => u.email?.toLowerCase() === targetEmail.toLowerCase()
    )

    if (!user) {
        console.error(
            `User with email "${targetEmail}" not found in auth.users.`
        )
        process.exit(1)
    }

    console.log(`Found user ${user.id} (${user.email}). Fetching profile...`)

    const { data: profile } = await supabase
        .from("profiles")
        .select("credits_balance")
        .eq("id", user.id)
        .single()

    const currentBalance = Number(profile?.credits_balance || 0)
    const newBalance = currentBalance + amount

    const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        credits_balance: newBalance,
        updated_at: new Date().toISOString(),
    })

    if (updateError) {
        console.error("Failed to update profile credits:", updateError.message)
        process.exit(1)
    }

    // Insert transaction log
    await supabase
        .from("credit_transactions")
        .insert({
            user_id: user.id,
            amount,
            type: "purchase",
            description: `Admin bonus R$ ${amount} granted to ${targetEmail}`,
            created_at: new Date().toISOString(),
        })
        .catch(() => {})

    console.log(
        `✅ Success! Granted R$ ${amount} credits to ${targetEmail}. Previous: R$ ${currentBalance}, New Balance: R$ ${newBalance}`
    )
}

main()
