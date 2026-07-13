import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import VideoUploadSection, { formatBytes } from "./VideoUploadSection"

describe("VideoUploadSection", () => {
    const defaultProps = {
        videoFile: null,
        onVideoFileChange: vi.fn(),
        error: undefined,
    }

    it("renders dropzone when no file is selected", () => {
        render(<VideoUploadSection {...defaultProps} />)
        expect(
            screen.getByText("Drag & drop video file here, or click to select")
        ).toBeInTheDocument()
        expect(screen.getByText("Browse Files")).toBeInTheDocument()
    })

    it("renders file info when a file is selected", () => {
        const file = new File(["test"], "test-video.mp4", { type: "video/mp4" })
        Object.defineProperty(file, "size", { value: 1024 * 1024 })
        render(<VideoUploadSection {...defaultProps} videoFile={file} />)
        expect(screen.getByText("test-video.mp4")).toBeInTheDocument()
    })

    it("calls onVideoFileChange when remove button is clicked", () => {
        const file = new File(["test"], "test-video.mp4", { type: "video/mp4" })
        const onVideoFileChange = vi.fn()
        render(
            <VideoUploadSection
                {...defaultProps}
                videoFile={file}
                onVideoFileChange={onVideoFileChange}
            />
        )
        fireEvent.click(screen.getByLabelText("Remove file"))
        expect(onVideoFileChange).toHaveBeenCalledWith(null)
    })

    it("displays error message when error prop is set", () => {
        render(
            <VideoUploadSection
                {...defaultProps}
                error="Video file is required"
            />
        )
        expect(screen.getByText("Video file is required")).toBeInTheDocument()
    })
})

describe("formatBytes", () => {
    it("returns KB for small values", () => {
        expect(formatBytes(500)).toBe("0KB")
    })

    it("returns MB for values above 1 MB", () => {
        expect(formatBytes(1024 * 1024)).toBe("1MB")
    })

    it("returns GB for values above 1 GB", () => {
        expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0GB")
    })
})
