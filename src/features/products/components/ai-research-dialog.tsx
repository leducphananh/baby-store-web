import { useState } from 'react'
import { Sparkles, Loader2, Check, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAiProductResearch } from '../hooks/use-ai-product-research'
import type { AiProductResearchResult } from '../api/ai-research-service'
import { formatCurrencyVND } from '@/utils/currency'
import { toast } from 'sonner'

interface AiResearchDialogProps {
  initialQuery?: string
  onApply: (data: AiProductResearchResult) => void
}

export function AiResearchDialog({ initialQuery = '', onApply }: AiResearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(initialQuery)
  const mutation = useAiProductResearch()

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    mutation.mutate(query)
  }

  const handleApply = () => {
    if (mutation.data) {
      onApply(mutation.data)
      toast.success('Đã áp dụng dữ liệu từ AI vào form')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" type="button" className="gap-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 hover:from-purple-200 hover:to-indigo-200 border border-purple-200">
          <Sparkles className="h-4 w-4" />
          Hỏi AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Tra cứu thông tin sản phẩm bằng AI
          </DialogTitle>
          <DialogDescription>
            Tìm kiếm giá bán lẻ tham khảo, hình ảnh và thông tin chung trên thị trường để điền nhanh vào form.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 my-4">
          <Input
            placeholder="Nhập tên sản phẩm cần tra cứu (VD: Bỉm Merries nội địa Nhật size M)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearch()
              }
            }}
            disabled={mutation.isPending}
            className="flex-1"
          />
          <Button type="button" onClick={() => handleSearch()} disabled={mutation.isPending || !query.trim()}>
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {mutation.isPending && (
          <div className="py-8 flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <p>Đang tổng hợp thông tin từ thị trường...</p>
          </div>
        )}

        {mutation.data && !mutation.isPending && (
          <div className="space-y-4 border rounded-md p-4 bg-muted/30">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Tên sản phẩm đề xuất</h4>
              <p className="text-sm">{mutation.data.name}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Giá bán lẻ tham khảo</h4>
              <p className="text-sm font-medium text-destructive">
                {mutation.data.sellingPrice > 0 
                  ? formatCurrencyVND(mutation.data.sellingPrice) 
                  : 'Không tìm thấy dữ liệu giá chính xác'}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Mô tả</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{mutation.data.description}</p>
            </div>

            {mutation.data.images && mutation.data.images.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Hình ảnh tham khảo</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {mutation.data.images.map((img, i) => (
                    <img 
                      key={i} 
                      src={img} 
                      alt={`Reference ${i}`} 
                      className="h-24 w-24 object-cover rounded-md border" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic">
                  * Bạn có thể lưu ảnh này về máy và upload lại vào form nếu cần.
                </p>
              </div>
            )}

            {mutation.data.sourceLinks && mutation.data.sourceLinks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Nguồn tham khảo</h4>
                <ul className="text-xs list-disc pl-4 space-y-1">
                  {mutation.data.sourceLinks.map((link, i) => (
                    <li key={i}>
                      <a href={link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline break-all">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Đóng
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={!mutation.data || mutation.isPending}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Áp dụng văn bản vào form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
