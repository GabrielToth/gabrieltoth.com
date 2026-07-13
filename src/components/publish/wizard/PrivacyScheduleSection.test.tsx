import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import PrivacyScheduleSection from "./PrivacyScheduleSection"

describe("PrivacyScheduleSection", () => {
    const defaultProps = {
        privacyStatus: "unlisted" as const,
        onPrivacyStatusChange: vi.fn(),
        scheduleType: "now" as const,
        onScheduleTypeChange: vi.fn(),
        scheduledDate: null,
        onScheduledDateChange: vi.fn(),
        scheduledTime: "",
        onScheduledTimeChange: vi.fn(),
        allowSchedule: true,
        errors: {} as Record<string, string>,
    }

    it("renders privacy status select", () => {
        render(<PrivacyScheduleSection {...defaultProps} />)
        expect(screen.getByText("Privacy Status")).toBeInTheDocument()
    })

    it("shows schedule options when allowSchedule is true", () => {
        render(<PrivacyScheduleSection {...defaultProps} />)
        expect(screen.getByText("Publish now")).toBeInTheDocument()
        expect(screen.getByText("Schedule for later")).toBeInTheDocument()
    })

    it("calls onScheduleTypeChange when 'Schedule for later' is clicked", () => {
        const onScheduleTypeChange = vi.fn()
        render(
            <PrivacyScheduleSection
                {...defaultProps}
                onScheduleTypeChange={onScheduleTypeChange}
            />
        )
        fireEvent.click(screen.getByText("Schedule for later"))
        expect(onScheduleTypeChange).toHaveBeenCalledWith("later")
    })

    it("shows date/time inputs when scheduleType is 'later'", () => {
        render(
            <PrivacyScheduleSection
                {...defaultProps}
                scheduleType="later"
                scheduledTime="10:00"
            />
        )
        expect(screen.getByText("Publish Date")).toBeInTheDocument()
        expect(screen.getByText("Publish Time")).toBeInTheDocument()
    })

    it("does not show schedule options when allowSchedule is false", () => {
        render(
            <PrivacyScheduleSection {...defaultProps} allowSchedule={false} />
        )
        expect(screen.queryByText("Publish now")).not.toBeInTheDocument()
        expect(screen.queryByText("Schedule for later")).not.toBeInTheDocument()
    })

    it("shows schedule error when provided", () => {
        render(
            <PrivacyScheduleSection
                {...defaultProps}
                errors={{ schedule: "Schedule date is required" }}
            />
        )
        expect(
            screen.getByText("Schedule date is required")
        ).toBeInTheDocument()
    })
})
