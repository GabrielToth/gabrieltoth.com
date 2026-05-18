import { isPostgresAvailable } from "./requires-postgres"

/** Call from suite beforeAll to skip integration tests when PostgreSQL is unavailable. */
export async function skipSuiteWithoutPostgres({
    skip,
}: {
    skip: (note?: string) => void
}): Promise<boolean> {
    if (!(await isPostgresAvailable())) {
        skip("PostgreSQL not available")
        return false
    }
    return true
}
