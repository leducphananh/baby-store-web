import { supabase } from '@/lib/supabase'

export interface AiProductResearchResult {
  name: string
  description: string
  sellingPrice: number
  images: string[]
  sourceLinks: string[]
}

export async function aiProductResearch(query: string): Promise<AiProductResearchResult> {
  const { data, error } = await supabase.functions.invoke('ai-product-research', {
    body: { query },
  })

  if (error) {
    throw new Error(error.message || 'Lỗi khi gọi AI')
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data.data as AiProductResearchResult
}
