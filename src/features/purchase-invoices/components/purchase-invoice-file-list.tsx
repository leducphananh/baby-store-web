import { useRef, useState } from 'react'
import { Download, FileText, Image as ImageIcon, Loader2, Paperclip, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { formatNumber } from '@/utils/number'
import { formatDate } from '@/utils/date'
import { getInvoiceFileDownloadUrl } from '@/features/purchase-invoices/api/get-purchase-invoices'
import { useDeletePurchaseInvoiceFile } from '@/features/purchase-invoices/hooks/use-delete-purchase-invoice-file'
import { useUploadPurchaseInvoiceFile } from '@/features/purchase-invoices/hooks/use-upload-purchase-invoice-file'
import { getInvoiceFileErrorMessage } from '@/features/purchase-invoices/utils/get-purchase-invoice-error-message'
import {
  ACCEPTED_INVOICE_ACCEPT,
  ACCEPTED_INVOICE_LABEL,
  validateInvoiceFile,
} from '@/features/purchase-invoices/utils/validate-invoice-file'
import type { PurchaseInvoiceFile } from '@/features/purchase-invoices/types/purchase-invoice'

type PendingUpload = { id: string; name: string }

function fileTypeLabel(mimeType: string | null): string {
  switch (mimeType) {
    case 'application/pdf':
      return 'PDF'
    case 'image/jpeg':
      return 'JPG'
    case 'image/png':
      return 'PNG'
    default:
      return 'Tệp'
  }
}

function formatFileSize(bytes: number | null): string | null {
  if (bytes === null || bytes <= 0) return null
  if (bytes < 1024 * 1024) return `${formatNumber(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function triggerDownload(url: string, fileName: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/**
 * Attachment list + uploader for one purchase invoice. Validation runs on
 * selection (before any network call); uploads run sequentially with a
 * per-file spinner; removing an attachment is confirmed. Files open via
 * short-lived signed URLs (private bucket) and download via a fresh
 * download-forced signed URL fetched on click.
 */
export function PurchaseInvoiceFileList({
  importReceiptId,
  invoiceId,
  files,
  canManage,
}: {
  importReceiptId: string
  invoiceId: string
  files: PurchaseInvoiceFile[]
  canManage: boolean
}) {
  const uploadFile = useUploadPurchaseInvoiceFile({ importReceiptId, purchaseInvoiceId: invoiceId })
  const deleteFile = useDeletePurchaseInvoiceFile(importReceiptId)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [rejections, setRejections] = useState<string[]>([])
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PurchaseInvoiceFile | null>(null)

  async function handleFiles(selected: File[]) {
    if (selected.length === 0) return

    const accepted: File[] = []
    const nextRejections: string[] = []
    for (const file of selected) {
      const result = await validateInvoiceFile(file)
      if (result.ok) accepted.push(file)
      else nextRejections.push(result.message)
    }
    setRejections(nextRejections)
    if (accepted.length === 0) return

    setIsUploading(true)
    let uploaded = 0
    for (const file of accepted) {
      const id = crypto.randomUUID()
      setPending((current) => [...current, { id, name: file.name }])
      try {
        await uploadFile.mutateAsync(file)
        uploaded += 1
      } catch {
        // useUploadPurchaseInvoiceFile already surfaced the error as a toast.
      } finally {
        setPending((current) => current.filter((item) => item.id !== id))
      }
    }
    setIsUploading(false)
    if (uploaded > 0) {
      toast.success(uploaded === 1 ? 'Đã tải lên 1 tệp' : `Đã tải lên ${uploaded} tệp`)
    }
  }

  function openFilePicker() {
    setRejections([])
    fileInputRef.current?.click()
  }

  async function handleDownload(file: PurchaseInvoiceFile) {
    setDownloadingId(file.id)
    try {
      const url = await getInvoiceFileDownloadUrl({
        storagePath: file.storagePath,
        fileName: file.fileName,
      })
      triggerDownload(url, file.fileName)
    } catch (error) {
      toast.error(getInvoiceFileErrorMessage(error, 'upload'))
    } finally {
      setDownloadingId(null)
    }
  }

  const hasFiles = files.length > 0 || pending.length > 0

  return (
    <div className="space-y-2">
      {canManage && (
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_INVOICE_ACCEPT}
          multiple
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => {
            const selected = event.target.files ? Array.from(event.target.files) : []
            event.target.value = ''
            void handleFiles(selected)
          }}
        />
      )}

      {rejections.length > 0 && (
        <div
          role="alert"
          className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive"
        >
          {rejections.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      )}

      {hasFiles ? (
        <ul className="divide-y rounded-md border">
          {files.map((file) => {
            const size = formatFileSize(file.fileSize)
            const isImage = file.mimeType === 'image/jpeg' || file.mimeType === 'image/png'
            return (
              <li key={file.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                {isImage ? (
                  <ImageIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{fileTypeLabel(file.mimeType)}</Badge>
                    {size && <span>{size}</span>}
                    {file.createdAt && <span>Tải lên {formatDate(file.createdAt)}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      Mở
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={downloadingId === file.id}
                    onClick={() => void handleDownload(file)}
                  >
                    {downloadingId === file.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    Tải xuống
                  </Button>
                  {canManage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      disabled={deleteFile.isPending}
                      onClick={() => setDeleteTarget(file)}
                      aria-label={`Xóa tệp ${file.fileName}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </li>
            )
          })}

          {pending.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
              <span className="truncate">Đang tải lên {item.name}...</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Chưa có tệp đính kèm.</p>
      )}

      {canManage && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openFilePicker}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
          {isUploading ? 'Đang tải lên...' : 'Thêm tệp đính kèm'}
        </Button>
      )}

      <p className="text-xs text-muted-foreground">{ACCEPTED_INVOICE_LABEL} · tối đa 10MB mỗi tệp</p>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa tệp đính kèm"
        description={
          <>
            Xóa tệp <strong>{deleteTarget?.fileName}</strong> khỏi hóa đơn này? Tệp sẽ bị xóa khỏi
            kho lưu trữ và không thể khôi phục.
          </>
        }
        confirmLabel="Xóa"
        variant="destructive"
        isConfirming={deleteFile.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteFile.mutate(
            { id: deleteTarget.id, storagePath: deleteTarget.storagePath },
            { onSettled: () => setDeleteTarget(null) },
          )
        }}
      />
    </div>
  )
}
