"use client"

import { useTranslations } from "next-intl"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

interface CloseConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBackToEditing: () => void
    onSaveDraftAndClose: () => void
    onDiscardAndClose: () => void
}

export default function CloseConfirmDialog({
    open,
    onOpenChange,
    onBackToEditing,
    onSaveDraftAndClose,
    onDiscardAndClose,
}: CloseConfirmDialogProps) {
    const t = useTranslations("publish.closeConfirm")

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("title")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t("description")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                    <AlertDialogCancel
                        onClick={onBackToEditing}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t("backToEditing")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onSaveDraftAndClose}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {t("saveDraft")}
                    </AlertDialogAction>
                    <AlertDialogAction
                        onClick={onDiscardAndClose}
                        className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Trash2 className="h-4 w-4" />
                        {t("discard")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
