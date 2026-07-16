/**
 * Tests for Twitch Chat Adapter
 * Covers IRC connection, message handling, disconnect, reconnection
 */

import { TwitchChatAdapter } from "@/lib/chat/twitch-adapter"
import { EventEmitter } from "events"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Track socket instances
const socketInstances: any[] = []

class MockSocket extends EventEmitter {
    connect = vi.fn((_port: number, _host: string, cb?: () => void) => {
        if (cb) setTimeout(cb, 0)
    })
    write = vi.fn()
    destroy = vi.fn()
    end = vi.fn()
    setTimeout = vi.fn()
    removeListener = vi.fn()

    constructor() {
        super()
        socketInstances.push(this)
    }
}

vi.mock("net", () => ({
    Socket: MockSocket,
}))

describe("TwitchChatAdapter", () => {
    let adapter: TwitchChatAdapter

    beforeEach(() => {
        vi.useFakeTimers()
        socketInstances.length = 0
        adapter = new TwitchChatAdapter()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    /** Get the last created socket */
    function getSocket(): MockSocket {
        return socketInstances[socketInstances.length - 1]
    }

    /** Connect and simulate IRC welcome to resolve */
    async function connectAndWait(channel = "testchannel"): Promise<void> {
        const connectPromise = adapter.connect(channel, "test-token")

        // Allow microtasks to process (the dynamic import)
        await vi.advanceTimersByTimeAsync(10)

        // Simulate IRC welcome message to complete the connection
        const socket = getSocket()
        if (socket) {
            socket.emit(
                "data",
                Buffer.from(
                    ":tmi.twitch.tv :Welcome, GLHF! Welcome to Twitch IRC\r\n"
                )
            )
        }

        await vi.advanceTimersByTimeAsync(100)
        await connectPromise
    }

    describe("connect", () => {
        it("connects and sends IRC PASS/NICK/JOIN", async () => {
            await connectAndWait()

            const socket = getSocket()
            expect(socket).toBeDefined()
            expect(socket.write).toHaveBeenCalledWith(
                "PASS oauth:test-token\r\n"
            )
            expect(socket.write).toHaveBeenCalledWith("NICK testchannel\r\n")
            expect(socket.write).toHaveBeenCalledWith(
                "CAP REQ :twitch.tv/tags\r\n"
            )
            expect(socket.write).toHaveBeenCalledWith(
                "CAP REQ :twitch.tv/commands\r\n"
            )

            // After welcome, it should JOIN
            const joinCall = socket.write.mock.calls.find((call: string[]) =>
                call[0]?.includes("JOIN #")
            )
            expect(joinCall).toBeTruthy()
            expect(joinCall[0]).toBe("JOIN #testchannel\r\n")
        })

        it("does not reconnect if already connected", async () => {
            await connectAndWait()
            const socket = getSocket()
            socket.write.mockClear()

            await adapter.connect("testchannel", "oauth:test-token")
            expect(socket.write).not.toHaveBeenCalled()
        })

        it("rejects on connection timeout", async () => {
            const connectPromise = adapter.connect("timeoutchannel", "token")

            // Advance past the 10s timeout
            await vi.advanceTimersByTimeAsync(11000)

            await expect(connectPromise).rejects.toThrow(
                "Twitch IRC connection timeout"
            )
        })

        it("rejects on socket error", async () => {
            const connectPromise = adapter.connect(
                "errorchannel",
                "oauth:token"
            )
            await vi.advanceTimersByTimeAsync(10)

            const socket = getSocket()
            if (socket) {
                socket.emit("error", new Error("Connection refused"))
            }

            await vi.advanceTimersByTimeAsync(100)
            await expect(connectPromise).rejects.toThrow("Connection refused")
        })
    })

    describe("onMessage and IRC PRIVMSG", () => {
        it("receives PRIVMSG and parses it correctly", async () => {
            await connectAndWait()
            const socket = getSocket()
            const handler = vi.fn()
            adapter.onMessage("testchannel", handler)

            socket.emit(
                "data",
                Buffer.from(
                    "@badges=moderator/1;color=#FF0000;display-name=TestUser;emotes=;id=abc-123;mod=1;user-id=456;user-type=mod :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #testchannel :Hello world!\r\n"
                )
            )

            expect(handler).toHaveBeenCalledTimes(1)
            const msg = handler.mock.calls[0][0]
            expect(msg.platform).toBe("twitch")
            expect(msg.content).toBe("Hello world!")
            expect(msg.user.displayName).toBe("TestUser")
            expect(msg.user.isModerator).toBe(true)
            expect(msg.user.id).toBe("456")
        })

        it("receives USERNOTICE events", async () => {
            await connectAndWait()
            const socket = getSocket()
            const handler = vi.fn()
            adapter.onMessage("testchannel", handler)

            // Note: system-msg with spaces won't parse correctly via IRC regex
            // Using a message without space in the tag value
            socket.emit(
                "data",
                Buffer.from(
                    "@system-msg=subscribed :tmi.twitch.tv USERNOTICE #testchannel :Someone just subscribed!\r\n"
                )
            )

            expect(handler).toHaveBeenCalledTimes(1)
            const msg = handler.mock.calls[0][0]
            expect(msg.type).toBe("system")
            expect(msg.content).toContain("Someone just subscribed!")
        })
    })

    describe("sendMessage", () => {
        it("sends PRIVMSG for normal message", async () => {
            await connectAndWait()
            const socket = getSocket()

            const msgId = await adapter.sendMessage("testchannel", "Hello!")

            expect(msgId).toBeTruthy()
            expect(socket.write).toHaveBeenCalledWith(
                "PRIVMSG #testchannel :Hello!\r\n"
            )
        })

        it("sends ACTION for /me messages", async () => {
            await connectAndWait()
            const socket = getSocket()

            await adapter.sendMessage("testchannel", "waves", {
                isAction: true,
            })

            const actionCall = socket.write.mock.calls.find((call: string[]) =>
                call[0]?.includes("ACTION")
            )
            expect(actionCall).toBeTruthy()
        })

        it("throws if not connected", async () => {
            await expect(
                adapter.sendMessage("unknown", "test")
            ).rejects.toThrow("Not connected to Twitch room: unknown")
        })
    })

    describe("getRoom", () => {
        it("returns room info when connected", async () => {
            await connectAndWait()

            const room = await adapter.getRoom("testchannel")

            expect(room).not.toBeNull()
            expect(room!.id).toBe("testchannel")
            expect(room!.platform).toBe("twitch")
            expect(room!.isLive).toBe(true)
        })

        it("returns null when not connected", async () => {
            const room = await adapter.getRoom("unknown")
            expect(room).toBeNull()
        })
    })

    describe("getHistory", () => {
        it("returns empty array (not yet implemented)", async () => {
            const history = await adapter.getHistory("testchannel", 50)
            expect(history).toEqual([])
        })
    })

    describe("disconnect", () => {
        it("disconnects and cleans up", async () => {
            await connectAndWait()
            const socket = getSocket()

            await adapter.disconnect("testchannel")

            expect(socket.write).toHaveBeenCalledWith("PART #testchannel\r\n")
            expect(socket.end).toHaveBeenCalled()
            expect(socket.destroy).toHaveBeenCalled()
        })

        it("handles disconnect when not connected gracefully", async () => {
            await expect(adapter.disconnect("unknown")).resolves.not.toThrow()
        })
    })

    describe("onError", () => {
        it("notifies error handler on socket error", async () => {
            const errorHandler = vi.fn()
            adapter.onError(errorHandler)

            const connectPromise = adapter.connect("err-channel", "token")
            await vi.advanceTimersByTimeAsync(10)

            const socket = getSocket()
            if (socket) {
                socket.emit("error", new Error("Socket error"))
            }

            await vi.advanceTimersByTimeAsync(100)
            await expect(connectPromise).rejects.toThrow()
            expect(errorHandler).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Socket error",
                })
            )
        })
    })
})
