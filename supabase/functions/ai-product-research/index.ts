import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductResearchRequest {
  query: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json() as ProductResearchRequest

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let apiKey = Deno.env.get('GEMINI_API_KEY')
    if (apiKey) {
      // Remove any accidental quotes or whitespace from the secret
      apiKey = apiKey.replace(/^["']|["']$/g, '').trim()
    }
    // Fallback to mock data if no API key is provided, so the app still works for the user.
    if (!apiKey) {
      console.log('GEMINI_API_KEY not set. Returning mock data.')
      return new Response(
        JSON.stringify({
          data: {
            name: query,
            description: `Mô tả tự động tạo cho: ${query}. Đây là dữ liệu giả lập vì chưa cấu hình GEMINI_API_KEY trong hệ thống.`,
            sellingPrice: 350000,
            images: [
              'https://placehold.co/400x400/png?text=Mock+Image+1',
              'https://placehold.co/400x400/png?text=Mock+Image+2'
            ],
            sourceLinks: ['https://example.com/product/123']
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Gemini API
    const prompt = `Bạn là một chuyên gia nghiên cứu thị trường sản phẩm mẹ và bé tại Việt Nam.
Tôi cần tìm hiểu thông tin về sản phẩm sau: "${query}"

Yêu cầu cực kỳ quan trọng:
1. Giá bán lẻ tham khảo phải sát với giá thực tế trên thị trường (Shopee, Lazada, Kidsplaza, Con Cưng...).
2. Hình ảnh (images) và nguồn tham khảo (sourceLinks): TUYỆT ĐỐI KHÔNG tự bịa ra URL (hallucinate). Nếu không có link thật, hãy trả về mảng rỗng [].

Hãy trả về kết quả định dạng JSON với cấu trúc chính xác như sau (không kèm theo markdown code block, chỉ trả về JSON thuần):
{
  "name": "Tên đầy đủ của sản phẩm",
  "description": "Mô tả ngắn gọn về sản phẩm (tính năng nổi bật, công dụng)",
  "sellingPrice": 0, // Giá bán lẻ tham khảo trung bình (số nguyên VND, ví dụ 350000. Nếu không rõ thì để 0)
  "images": [
    "url_anh_1"
  ], // URL ảnh sản phẩm (chỉ dùng link thật, nếu không có trả về [])
  "sourceLinks": [
    "link_tham_khao_1"
  ] // Link bài viết/sản phẩm tham khảo (chỉ dùng link thật, nếu không có trả về [])
}
`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API Error:', errorText)
      throw new Error(`Lỗi từ Gemini API: ${errorText}`)
    }

    const result = await response.json()
    const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!textOutput) {
      throw new Error('Invalid response from Gemini')
    }

    let parsedData
    try {
      let jsonString = textOutput
      const firstBrace = textOutput.indexOf('{')
      const lastBrace = textOutput.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = textOutput.slice(firstBrace, lastBrace + 1)
      }
      parsedData = JSON.parse(jsonString)
    } catch (e) {
      console.error('Failed to parse AI output:', textOutput)
      throw new Error('AI trả về JSON không hợp lệ', { cause: e })
    }

    return new Response(JSON.stringify({ data: parsedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const err = error as Error
    console.error('Edge Function Error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
