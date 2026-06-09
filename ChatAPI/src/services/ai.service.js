import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import config from '../config/index.js';

const TRANSLATOR_SYSTEM_PROMPT = `Bạn là một phiên dịch viên chuyên nghiệp Anh-Việt.

Quy tắc:
1. Nếu người dùng nhập tiếng Anh (có thể chứa tiếng Việt xen lẫn) → dịch sang tiếng Việt tự nhiên, chính xác
2. Nếu người dùng nhập tiếng Việt (có thể chứa tiếng Anh xen lẫn) → dịch sang tiếng Anh chính xác, tự nhiên
3. Giữ nguyên ý nghĩa, ngữ cảnh và sắc thái của câu gốc
4. Chỉ trả về bản dịch, không thêm giải thích, bình luận, hay markdown formatting
5. Nếu text không rõ ràng hoặc không thể dịch, trả lời đúng format: "Không thể dịch: [lý do ngắn gọn]"
6. Dịch các thành ngữ, slang một cách tự nhiên nhất có thể, giữ nguyên tên riêng (người, địa điểm)
7. Không thêm dấu ngoặc kép hay bất kỳ format đặc biệt nào cho bản dịch
8. Không in đậm, không italic, không gạch đầu dòng — chỉ plain text thuần túy`;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

const MODEL_NAME = 'nvidia/nemotron-3-super-120b-a12b:free';

export class AIService {
  detectLanguage(text) {
    if (!text || typeof text !== 'string') return 'unknown';

    const cleanText = text.trim();
    if (!cleanText) return 'unknown';

    const vietnameseDiacritics = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi;
    const vietnameseMatches = cleanText.match(vietnameseDiacritics);
    const vietnameseScore = vietnameseMatches ? vietnameseMatches.length : 0;

    const englishCommonWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
      'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
      'is', 'was', 'are', 'were', 'been', 'has', 'had', 'can', 'could', 'should',
      'how', 'when', 'your', 'our', 'its', 'him', 'them', 'then', 'than', 'now',
    ]);

    const words = cleanText.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter((w) => englishCommonWords.has(w)).length;
    const totalWords = words.length;

    const hasVietnameseDiacritics = vietnameseScore > 0;
    const shortText = totalWords < 3;

    if (hasVietnameseDiacritics) return 'vi';
    if (shortText) return 'en';
    if (englishWordCount / totalWords > 0.4) return 'en';
    return 'en';
  }

  getDirection(sourceLang) {
    return sourceLang === 'en' ? 'Anh \u2192 Việt' : 'Việt \u2192 Anh';
  }

  async translate(text) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return {
        original: text || '',
        translated: 'Vui lòng nhập text để dịch.',
        direction: null,
        detectedLang: 'unknown',
      };
    }

    const cleanText = text.trim();

    // Limit input to ~2000 tokens (~8000 characters) to avoid excessive API usage
    if (cleanText.length > 8000) {
      return {
        original: cleanText.slice(0, 8000),
        translated: 'Text quá dài. Vui lòng nhập tối đa 8000 ký tự.',
        direction: null,
        detectedLang: this.detectLanguage(cleanText.slice(0, 8000)),
      };
    }

    const detectedLang = this.detectLanguage(cleanText);
    const direction = this.getDirection(detectedLang);

    const { text: translated } = await generateText({
      model: openrouter.chat(MODEL_NAME),
      system: TRANSLATOR_SYSTEM_PROMPT,
      prompt: cleanText,
    });

    const trimmed = (translated || '').trim();
    if (!trimmed) {
      return {
        original: cleanText,
        translated: 'Không thể dịch: nội dung trả về trống. Vui lòng thử lại.',
        direction,
        detectedLang,
      };
    }

    return {
      original: cleanText,
      translated: trimmed,
      direction,
      detectedLang,
    };
  }
}

export default new AIService();
