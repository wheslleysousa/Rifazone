import { GoogleGenAI, Type } from '@google/genai';
import { Promocao, OfertaRelampago } from '../src/types.js';

export interface GerarCampanhaInput {
  premio: string;             // Ex: "iPhone 16 Pro Max 256GB"
  valorCota?: number;         // Ex: 0.50
  totalCotas?: number;        // Ex: 10000
  publico?: string;           // Ex: "jovens de 18 a 35 anos"
  tom?: string;               // Ex: "urgente e animado"
}

export interface GerarCampanhaResult {
  titulo: string;
  subtitulo: string;
  descricaoHtml: string;      // Regulamento em HTML
  selo: string;               // Selo de urgência
  premios: { posicao: number; descricao: string }[];
  promocoes: Promocao[];
  ofertaRelampago: OfertaRelampago;
  isMock: boolean;            // true quando gerado por fallback heurístico (sem GEMINI_API_KEY)
}

const MODELO_PADRAO = 'gemini-2.5-flash';

/**
 * Serviço de IA generativa (Google Gemini) usado pelo painel administrativo
 * para gerar automaticamente o conteúdo de marketing de uma campanha de rifa:
 * título, subtítulo, regulamento, selo de urgência, prêmios e pacotes promocionais.
 *
 * Segue o mesmo padrão do MercadoPagoService: quando GEMINI_API_KEY não está
 * configurada, cai em um fallback heurístico transparente para que todo o fluxo
 * possa ser testado imediatamente na UI (modo simulação).
 */
export class GeminiService {
  private client: GoogleGenAI | null = null;

  constructor() {
    this.init();
  }

  private init() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.client = new GoogleGenAI({ apiKey });
        console.log('Gemini (Google GenAI) inicializado com sucesso.');
      } catch (err) {
        console.error('Erro ao inicializar o cliente Gemini:', err);
      }
    } else {
      console.log('GEMINI_API_KEY não definido. Assistente de IA em MODO SIMULAÇÃO (fallback heurístico).');
    }
  }

  public isConfigured(): boolean {
    return !!this.client;
  }

  public async gerarCampanha(input: GerarCampanhaInput): Promise<GerarCampanhaResult> {
    const premio = (input.premio || '').trim();
    if (!premio) {
      throw new Error('Descreva o prêmio principal para a IA gerar a campanha.');
    }

    if (this.client) {
      try {
        const valorCota = input.valorCota ?? 0.5;
        const totalCotas = input.totalCotas ?? 10000;

        const prompt = [
          'Você é um copywriter especialista em campanhas de rifas e sorteios online no Brasil (padrão "rifa premiada").',
          'Gere o conteúdo de marketing de UMA campanha, em português do Brasil, persuasivo, honesto e em conformidade com a legislação (sem promessas enganosas).',
          '',
          `Prêmio principal: ${premio}`,
          `Valor por cota: R$ ${valorCota.toFixed(2)}`,
          `Total de cotas: ${totalCotas}`,
          input.publico ? `Público-alvo: ${input.publico}` : '',
          input.tom ? `Tom de voz desejado: ${input.tom}` : 'Tom de voz: animado, confiável e com senso de urgência.',
          '',
          'Regras:',
          '- titulo: chamativo, até 80 caracteres, pode incluir um bônus em Pix.',
          '- subtitulo: uma frase curta de reforço.',
          '- descricaoHtml: regulamento/descrição em HTML simples (use <p>, <strong>, <ul>, <li>). Explique prêmios, forma de sorteio (Loteria Federal) e pagamento via Pix.',
          '- selo: frase curta de urgência com no máximo um emoji.',
          '- premios: de 1 a 3 prêmios coerentes com o prêmio principal.',
          '- promocoes: 4 pacotes (quantidade crescente) com preço com desconto progressivo; marque destaque=true no melhor custo-benefício.',
          '- ofertaRelampago: um upsell atraente de cotas extras com desconto.',
        ].filter(Boolean).join('\n');

        const response = await this.client.models.generateContent({
          model: MODELO_PADRAO,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                titulo: { type: Type.STRING },
                subtitulo: { type: Type.STRING },
                descricaoHtml: { type: Type.STRING },
                selo: { type: Type.STRING },
                premios: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      posicao: { type: Type.NUMBER },
                      descricao: { type: Type.STRING },
                    },
                    required: ['posicao', 'descricao'],
                  },
                },
                promocoes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      quantidade: { type: Type.NUMBER },
                      valor: { type: Type.NUMBER },
                      destaque: { type: Type.BOOLEAN },
                    },
                    required: ['quantidade', 'valor', 'destaque'],
                  },
                },
                ofertaRelampago: {
                  type: Type.OBJECT,
                  properties: {
                    titulo: { type: Type.STRING },
                    subtitulo: { type: Type.STRING },
                    cotasExtras: { type: Type.NUMBER },
                    preco: { type: Type.NUMBER },
                    selo: { type: Type.STRING },
                  },
                  required: ['titulo', 'subtitulo', 'cotasExtras', 'preco', 'selo'],
                },
              },
              required: ['titulo', 'subtitulo', 'descricaoHtml', 'selo', 'premios', 'promocoes', 'ofertaRelampago'],
            },
          },
        });

        const texto = (response.text || '').trim();
        const parsed = JSON.parse(texto);
        return this.normalizar(parsed, input, false);
      } catch (error: any) {
        console.error('Erro na geração via Gemini, usando fallback:', error?.message || error);
        // fallback transparente abaixo
      }
    }

    // Fallback heurístico (modo simulação) — permite testar o fluxo sem chave de API.
    return this.gerarFallback(input);
  }

  /** Garante tipos/estrutura consistentes com src/types.ts a partir da saída da IA. */
  private normalizar(parsed: any, input: GerarCampanhaInput, isMock: boolean): GerarCampanhaResult {
    const premios = Array.isArray(parsed?.premios) && parsed.premios.length > 0
      ? parsed.premios.map((p: any, i: number) => ({
          posicao: Number(p.posicao) || i + 1,
          descricao: String(p.descricao || input.premio),
        }))
      : [{ posicao: 1, descricao: input.premio }];

    const promocoes: Promocao[] = Array.isArray(parsed?.promocoes)
      ? parsed.promocoes.map((p: any) => ({
          quantidade: Math.max(1, Math.round(Number(p.quantidade) || 0)),
          valor: Number(Number(p.valor || 0).toFixed(2)),
          destaque: !!p.destaque,
        })).filter((p: Promocao) => p.quantidade > 0 && p.valor > 0)
      : [];

    const o = parsed?.ofertaRelampago || {};
    const ofertaRelampago: OfertaRelampago = {
      titulo: String(o.titulo || 'Oferta Turbinada 🔥'),
      subtitulo: String(o.subtitulo || 'Adicione cotas extras com desconto exclusivo'),
      cotasExtras: Math.max(1, Math.round(Number(o.cotasExtras) || 20)),
      preco: Number(Number(o.preco || (input.valorCota ?? 0.5) * 14).toFixed(2)),
      selo: String(o.selo || 'OFERTA LIMITADA'),
    };

    return {
      titulo: String(parsed?.titulo || input.premio).slice(0, 120),
      subtitulo: String(parsed?.subtitulo || 'Participe agora do sorteio oficial!'),
      descricaoHtml: String(parsed?.descricaoHtml || `<p>Concorra a <strong>${input.premio}</strong>!</p>`),
      selo: String(parsed?.selo || 'Corre que essa vai rápido! 🔥'),
      premios,
      promocoes,
      ofertaRelampago,
      isMock,
    };
  }

  /** Fallback determinístico que monta uma campanha plausível sem chamar a API. */
  private gerarFallback(input: GerarCampanhaInput): GerarCampanhaResult {
    const premio = input.premio.trim();
    const valorCota = input.valorCota ?? 0.5;
    const pacote = (qtd: number, desconto: number, destaque = false): Promocao => ({
      quantidade: qtd,
      valor: Number((qtd * valorCota * desconto).toFixed(2)),
      destaque,
    });

    return {
      titulo: `${premio} + Bônus no Pix 🤑`,
      subtitulo: 'Sorteio oficial pela Loteria Federal. Pague no Pix e receba na hora!',
      descricaoHtml:
        `<p><strong>Participe e concorra a ${premio}!</strong></p>` +
        `<ul>` +
        `<li><strong>1º Prêmio:</strong> ${premio}</li>` +
        `<li><strong>Cotas premiadas:</strong> Pix instantâneo para quem encontrar os números da sorte</li>` +
        `</ul>` +
        `<p>Sorteio com base na <strong>Loteria Federal</strong>. Pagamento confirmado na hora via <strong>Pix Mercado Pago</strong> e números liberados automaticamente no seu WhatsApp.</p>`,
      selo: 'Corre que essa vai rápido! 🔥',
      premios: [{ posicao: 1, descricao: premio }],
      promocoes: [
        pacote(10, 1.0),
        pacote(30, 0.93),
        pacote(50, 0.9, true),
        pacote(100, 0.85),
      ],
      ofertaRelampago: {
        titulo: 'Oferta Turbinada 🔥',
        subtitulo: 'Adicione +20 cotas com 30% de desconto',
        cotasExtras: 20,
        preco: Number((20 * valorCota * 0.7).toFixed(2)),
        selo: 'OFERTA LIMITADA',
      },
      isMock: true,
    };
  }
}

export const geminiService = new GeminiService();
