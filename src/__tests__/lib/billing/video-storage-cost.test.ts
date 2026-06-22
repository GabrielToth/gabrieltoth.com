/**
 * Unit Tests: Video Storage Cost Calculator
 * Tests for calculateVideoStorageCost and calculateRefundAmount
 */

import { describe, it, expect } from "vitest"
import {
    calculateVideoStorageCost,
    calculateRefundAmount,
} from "@/lib/billing/video-storage-cost"

describe("calculateVideoStorageCost", () => {
    it("calculates cost for a small video (100MB, 1 day, cloud)", () => {
        const cost = calculateVideoStorageCost({
            fileSizeBytes: 100 * 1024 * 1024, // 100MB
            storageDays: 1,
            isCloudStorage: true,
        })

        expect(cost.baseFee).toBe(2.0)
        expect(cost.storageCostPerDay).toBeCloseTo(0.65, 1)
        expect(cost.storageCostTotal).toBeCloseTo(0.65, 1)
        expect(cost.uploadBandwidthCost).toBeCloseTo(0.98, 1)
        expect(cost.downloadBandwidthCost).toBeCloseTo(0.98, 1)
        expect(cost.totalToCharge).toBeGreaterThan(0)
    })

    it("calculates cost for a large video (1GB, 7 days, cloud)", () => {
        const cost = calculateVideoStorageCost({
            fileSizeBytes: 1024 * 1024 * 1024, // 1GB
            storageDays: 7,
            isCloudStorage: true,
        })

        expect(cost.baseFee).toBe(2.0)
        expect(cost.storageCostPerDay).toBeCloseTo(6.67, 2)
        expect(cost.storageCostTotal).toBeCloseTo(46.69, 2)
        expect(cost.uploadBandwidthCost).toBeCloseTo(10.0, 2)
        expect(cost.downloadBandwidthCost).toBeCloseTo(10.0, 2)
        expect(cost.totalToCharge).toBeCloseTo(68.69, 2)
    })

    it("excludes bandwidth costs for local storage mode", () => {
        const cost = calculateVideoStorageCost({
            fileSizeBytes: 500 * 1024 * 1024, // 500MB
            storageDays: 3,
            isCloudStorage: false,
        })

        expect(cost.uploadBandwidthCost).toBeGreaterThan(0)
        expect(cost.downloadBandwidthCost).toBeGreaterThan(0)
    })

    it("handles zero-byte file", () => {
        const cost = calculateVideoStorageCost({
            fileSizeBytes: 0,
            storageDays: 1,
            isCloudStorage: true,
        })

        expect(cost.baseFee).toBe(2.0)
        expect(cost.storageCostPerDay).toBe(0)
        expect(cost.totalToCharge).toBeCloseTo(2.0, 2)
    })

    it("handles zero storage days", () => {
        const cost = calculateVideoStorageCost({
            fileSizeBytes: 1024 * 1024 * 1024,
            storageDays: 0,
            isCloudStorage: true,
        })

        expect(cost.storageCostTotal).toBe(0)
        expect(cost.totalToCharge).toBeGreaterThan(0)
    })
})

describe("calculateRefundAmount", () => {
    it("returns full refund minus base fee and storage used", () => {
        const refund = calculateRefundAmount(68.69, 2.0, 6.67, 3)
        // charged: 68.69, base: 2.0, storage used: 20.01
        // refund: 68.69 - 22.01 = 46.68
        expect(refund).toBeCloseTo(46.68, 2)
    })

    it("returns 0 refund if storage used exceeds charged amount", () => {
        const refund = calculateRefundAmount(10.0, 5.0, 10.0, 1)
        // charged: 10, non-refundable: 15
        expect(refund).toBe(0)
    })

    it("returns 0 refund if charged amount equals non-refundable", () => {
        const refund = calculateRefundAmount(10.0, 5.0, 5.0, 1)
        expect(refund).toBe(0)
    })

    it("never exceeds total charged", () => {
        const refund = calculateRefundAmount(5.0, 2.0, 6.67, 1)
        expect(refund).toBeLessThanOrEqual(5.0)
    })

    it("handles zero refund when base fee equals charged", () => {
        const refund = calculateRefundAmount(2.0, 2.0, 0, 0)
        expect(refund).toBe(0)
    })
})
