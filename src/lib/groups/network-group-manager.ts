/**
 * Network Group Manager Service
 * Manages user-defined groups of social networks
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

import { createClient } from "@supabase/supabase-js"
import { CACHE_KEYS, CacheManager } from "../cache"
import { createLogger } from "../logger"
import type { SocialPlatform } from "../networks"

const logger = createLogger("NetworkGroupManager")

/**
 * Network group record
 */
export interface NetworkGroup {
    id: string
    userId: string
    name: string
    description?: string
    networks: SocialPlatform[]
    createdAt: number
    updatedAt: number
}

/**
 * Network Group Manager
 * Handles group creation, deletion, renaming, and network management
 */
export class NetworkGroupManager {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    /**
     * Create a new network group
     */
    async createGroup(
        userId: string,
        name: string,
        description?: string
    ): Promise<NetworkGroup> {
        try {
            // Validate group name is unique for user
            const { data: existing } = await this.supabase
                .from("network_groups")
                .select("id")
                .eq("user_id", userId)
                .eq("name", name)
                .single()

            if (existing) {
                throw new Error(
                    `Group with name "${name}" already exists for this user`
                )
            }

            const now = Date.now()

            const { data, error } = await this.supabase
                .from("network_groups")
                .insert({
                    user_id: userId,
                    name,
                    description: description || null,
                    created_at: new Date(now),
                    updated_at: new Date(now),
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            // Invalidate cache
            await CacheManager.delete(CACHE_KEYS.USER_GROUPS(userId))

            logger.info("Network group created", {
                userId,
                groupId: data.id,
                name,
            })

            return this.mapDatabaseToGroup(data, [])
        } catch (error) {
            logger.error("Failed to create network group", {
                userId,
                name,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Delete a network group
     */
    async deleteGroup(userId: string, groupId: string): Promise<boolean> {
        try {
            // Verify group belongs to user
            const { data: group } = await this.supabase
                .from("network_groups")
                .select("id")
                .eq("id", groupId)
                .eq("user_id", userId)
                .single()

            if (!group) {
                throw new Error("Group not found")
            }

            // Delete all networks in the group
            await this.supabase
                .from("group_networks")
                .delete()
                .eq("group_id", groupId)

            // Delete the group
            const { error } = await this.supabase
                .from("network_groups")
                .delete()
                .eq("id", groupId)
                .eq("user_id", userId)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            // Invalidate cache
            await CacheManager.delete(CACHE_KEYS.USER_GROUPS(userId))

            logger.info("Network group deleted", { userId, groupId })

            return true
        } catch (error) {
            logger.error("Failed to delete network group", {
                userId,
                groupId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Rename a network group
     */
    async renameGroup(
        userId: string,
        groupId: string,
        newName: string
    ): Promise<NetworkGroup> {
        try {
            // Verify group belongs to user
            const { data: group } = await this.supabase
                .from("network_groups")
                .select("*")
                .eq("id", groupId)
                .eq("user_id", userId)
                .single()

            if (!group) {
                throw new Error("Group not found")
            }

            // Check if new name is unique
            const { data: existing } = await this.supabase
                .from("network_groups")
                .select("id")
                .eq("user_id", userId)
                .eq("name", newName)
                .neq("id", groupId)
                .single()

            if (existing) {
                throw new Error(
                    `Group with name "${newName}" already exists for this user`
                )
            }

            const now = Date.now()

            const { data, error } = await this.supabase
                .from("network_groups")
                .update({
                    name: newName,
                    updated_at: new Date(now),
                })
                .eq("id", groupId)
                .select()
                .single()

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            // Get networks for the group
            const networks = await this.getGroupNetworks(groupId)

            // Invalidate cache
            await CacheManager.delete(CACHE_KEYS.USER_GROUPS(userId))

            logger.info("Network group renamed", {
                userId,
                groupId,
                newName,
            })

            return this.mapDatabaseToGroup(data, networks)
        } catch (error) {
            logger.error("Failed to rename network group", {
                userId,
                groupId,
                newName,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Add a network to a group
     */
    async addNetworkToGroup(
        userId: string,
        groupId: string,
        platform: SocialPlatform
    ): Promise<NetworkGroup> {
        try {
            // Verify group belongs to user
            const { data: group } = await this.supabase
                .from("network_groups")
                .select("*")
                .eq("id", groupId)
                .eq("user_id", userId)
                .single()

            if (!group) {
                throw new Error("Group not found")
            }

            // Check if network is already in group
            const { data: existing } = await this.supabase
                .from("group_networks")
                .select("id")
                .eq("group_id", groupId)
                .eq("platform", platform)
                .single()

            if (existing) {
                logger.warn("Network already in group", {
                    groupId,
                    platform,
                })
                // Return the group as-is
                const networks = await this.getGroupNetworks(groupId)
                return this.mapDatabaseToGroup(group, networks)
            }

            // Add network to group
            const { error } = await this.supabase
                .from("group_networks")
                .insert({
                    group_id: groupId,
                    platform,
                })

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            // Get updated networks
            const networks = await this.getGroupNetworks(groupId)

            // Invalidate cache
            await CacheManager.delete(CACHE_KEYS.USER_GROUPS(userId))

            logger.info("Network added to group", {
                userId,
                groupId,
                platform,
            })

            return this.mapDatabaseToGroup(group, networks)
        } catch (error) {
            logger.error("Failed to add network to group", {
                userId,
                groupId,
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Remove a network from a group
     */
    async removeNetworkFromGroup(
        userId: string,
        groupId: string,
        platform: SocialPlatform
    ): Promise<NetworkGroup> {
        try {
            // Verify group belongs to user
            const { data: group } = await this.supabase
                .from("network_groups")
                .select("*")
                .eq("id", groupId)
                .eq("user_id", userId)
                .single()

            if (!group) {
                throw new Error("Group not found")
            }

            // Remove network from group
            const { error } = await this.supabase
                .from("group_networks")
                .delete()
                .eq("group_id", groupId)
                .eq("platform", platform)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            // Get updated networks
            const networks = await this.getGroupNetworks(groupId)

            // Invalidate cache
            await CacheManager.delete(CACHE_KEYS.USER_GROUPS(userId))

            logger.info("Network removed from group", {
                userId,
                groupId,
                platform,
            })

            return this.mapDatabaseToGroup(group, networks)
        } catch (error) {
            logger.error("Failed to remove network from group", {
                userId,
                groupId,
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get all groups for a user
     */
    async getUserGroups(userId: string): Promise<NetworkGroup[]> {
        try {
            // Try to get from cache first
            const cacheKey = CACHE_KEYS.USER_GROUPS(userId)
            const cached = await CacheManager.get<NetworkGroup[]>(cacheKey)

            if (cached) {
                logger.debug("User groups retrieved from cache", { userId })
                return cached
            }

            // Get from database
            const { data, error } = await this.supabase
                .from("network_groups")
                .select("*")
                .eq("user_id", userId)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            const groups: NetworkGroup[] = []

            for (const group of data || []) {
                const networks = await this.getGroupNetworks(group.id)
                groups.push(this.mapDatabaseToGroup(group, networks))
            }

            // Cache for 5 minutes
            await CacheManager.set(cacheKey, groups, 5 * 60)

            logger.info("User groups retrieved", {
                userId,
                count: groups.length,
            })

            return groups
        } catch (error) {
            logger.error("Failed to retrieve user groups", {
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get a specific group
     */
    async getGroup(
        userId: string,
        groupId: string
    ): Promise<NetworkGroup | null> {
        try {
            const { data, error } = await this.supabase
                .from("network_groups")
                .select("*")
                .eq("id", groupId)
                .eq("user_id", userId)
                .single()

            if (error) {
                if (error.code === "PGRST116") {
                    // No rows found
                    return null
                }
                throw new Error(`Database error: ${error.message}`)
            }

            const networks = await this.getGroupNetworks(groupId)

            logger.info("Group retrieved", { userId, groupId })

            return this.mapDatabaseToGroup(data, networks)
        } catch (error) {
            logger.error("Failed to retrieve group", {
                userId,
                groupId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get networks in a group
     */
    private async getGroupNetworks(groupId: string): Promise<SocialPlatform[]> {
        try {
            const { data, error } = await this.supabase
                .from("group_networks")
                .select("platform")
                .eq("group_id", groupId)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            return (data || []).map(item => item.platform)
        } catch (error) {
            logger.error("Failed to retrieve group networks", {
                groupId,
                error: error instanceof Error ? error.message : String(error),
            })
            return []
        }
    }

    /**
     * Map database record to NetworkGroup
     */
    private mapDatabaseToGroup(
        dbGroup: any,
        networks: SocialPlatform[]
    ): NetworkGroup {
        return {
            id: dbGroup.id,
            userId: dbGroup.user_id,
            name: dbGroup.name,
            description: dbGroup.description || undefined,
            networks,
            createdAt: new Date(dbGroup.created_at).getTime(),
            updatedAt: new Date(dbGroup.updated_at).getTime(),
        }
    }
}

/**
 * Create a singleton Network Group Manager instance
 */
let networkGroupManagerInstance: NetworkGroupManager | null = null

/**
 * Get or create the Network Group Manager
 */
export function getNetworkGroupManager(): NetworkGroupManager {
    if (!networkGroupManagerInstance) {
        networkGroupManagerInstance = new NetworkGroupManager()
    }
    return networkGroupManagerInstance
}

/**
 * Reset the Network Group Manager (useful for testing)
 */
export function resetNetworkGroupManager(): void {
    networkGroupManagerInstance = null
}
