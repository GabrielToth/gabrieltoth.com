"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import {
    AlertCircle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
} from "lucide-react"
import { useMemo, useState } from "react"

interface PublicationRecord {
    id: string
    content: string
    networks: Array<{
        platform: string
        status: "success" | "failed" | "pending"
        externalId?: string
        externalUrl?: string
        error?: string
    }>
    publishedAt: Date
    scheduledAt?: Date
}

interface PublicationHistoryProps {
    publications?: PublicationRecord[]
    onRetry?: (publicationId: string) => void
}

const ITEMS_PER_PAGE = 10

export default function PublicationHistory({
    publications = [],
    onRetry,
}: PublicationHistoryProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [filterNetwork, setFilterNetwork] = useState<string>("all")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPublication, setSelectedPublication] =
        useState<PublicationRecord | null>(null)

    const filteredPublications = useMemo(() => {
        return publications.filter(pub => {
            const matchesSearch = pub.content
                .toLowerCase()
                .includes(searchTerm.toLowerCase())

            const matchesNetwork =
                filterNetwork === "all" ||
                pub.networks.some(n => n.platform === filterNetwork)

            const matchesStatus =
                filterStatus === "all" ||
                pub.networks.some(n => n.status === filterStatus)

            return matchesSearch && matchesNetwork && matchesStatus
        })
    }, [publications, searchTerm, filterNetwork, filterStatus])

    const totalPages = Math.ceil(filteredPublications.length / ITEMS_PER_PAGE)
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
    const paginatedPublications = filteredPublications.slice(
        startIdx,
        startIdx + ITEMS_PER_PAGE
    )

    const uniqueNetworks = Array.from(
        new Set(publications.flatMap(p => p.networks.map(n => n.platform)))
    )

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "success":
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case "failed":
                return <AlertCircle className="h-4 w-4 text-red-600" />
            case "pending":
                return <Clock className="h-4 w-4 text-yellow-600" />
            default:
                return null
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "success":
                return "bg-green-100 text-green-800"
            case "failed":
                return "bg-red-100 text-red-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
                <h3 className="font-semibold">Publication History</h3>
                <p className="text-sm text-gray-600">
                    View and manage your published posts
                </p>
            </div>

            <div className="space-y-3">
                <Input
                    placeholder="Search publications..."
                    value={searchTerm}
                    onChange={e => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1)
                    }}
                    aria-label="Search publications"
                />

                <div className="grid grid-cols-2 gap-2">
                    <Select
                        value={filterNetwork}
                        onValueChange={v => {
                            setFilterNetwork(v)
                            setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by network" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Networks</SelectItem>
                            {uniqueNetworks.map(network => (
                                <SelectItem key={network} value={network}>
                                    {network}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filterStatus}
                        onValueChange={v => {
                            setFilterStatus(v)
                            setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {paginatedPublications.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-sm text-gray-600">
                        No publications found
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {paginatedPublications.map(pub => (
                        <Dialog key={pub.id}>
                            <DialogTrigger asChild>
                                <div
                                    className="cursor-pointer rounded-lg border p-3 hover:bg-gray-50 transition"
                                    onClick={() => setSelectedPublication(pub)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium line-clamp-2">
                                                {pub.content}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {format(
                                                    pub.publishedAt,
                                                    "PPP p"
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 flex-wrap justify-end">
                                            {pub.networks.map(
                                                (network, idx) => (
                                                    <Badge
                                                        key={idx}
                                                        variant="secondary"
                                                        className={`gap-1 ${getStatusColor(network.status)}`}
                                                    >
                                                        {getStatusIcon(
                                                            network.status
                                                        )}
                                                        <span className="capitalize text-xs">
                                                            {network.platform}
                                                        </span>
                                                    </Badge>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </DialogTrigger>

                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>
                                        Publication Details
                                    </DialogTitle>
                                    <DialogDescription>
                                        {format(pub.publishedAt, "PPP p")}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium mb-2">
                                            Content
                                        </h4>
                                        <p className="text-sm text-gray-700 line-clamp-4">
                                            {pub.content}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-2">
                                            Networks
                                        </h4>
                                        <div className="space-y-2">
                                            {pub.networks.map(
                                                (network, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between rounded-lg border p-2"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(
                                                                network.status
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-medium capitalize">
                                                                    {
                                                                        network.platform
                                                                    }
                                                                </p>
                                                                {network.error && (
                                                                    <p className="text-xs text-red-600">
                                                                        {
                                                                            network.error
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {network.externalUrl && (
                                                            <a
                                                                href={
                                                                    network.externalUrl
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-700"
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {pub.networks.some(
                                        n => n.status === "failed"
                                    ) &&
                                        onRetry && (
                                            <Button
                                                onClick={() => {
                                                    onRetry(pub.id)
                                                }}
                                                className="w-full"
                                            >
                                                Retry Failed
                                            </Button>
                                        )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-3">
                    <p className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                setCurrentPage(p => Math.max(1, p - 1))
                            }
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                setCurrentPage(p => Math.min(totalPages, p + 1))
                            }
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
