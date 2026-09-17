import { useMutation } from '@tanstack/react-query'
import { aiProductResearch } from '../api/ai-research-service'
import { toast } from 'sonner'

export function useAiProductResearch() {
  return useMutation({
    mutationFn: (query: string) => aiProductResearch(query),
    onError: (error) => {
      toast.error('Không thể tra cứu thông tin AI', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại sau',
      })
    },
  })
}
