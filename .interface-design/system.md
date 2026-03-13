# Design System: CleanFlow "Bold & Clarity" (High Contrast)

Este sistema padroniza a interface do CleanFlow baseando-se na estética desenvolvida no Caixa Diário. O objetivo é remover o estilo misturado entre Telas (brutalismo, clínicas antigas, etc.) e focar em impacto visual, legibilidade, alto contraste, fontes massivas e respiração (whitespace).

## 1. Intent & Feel
- **Who:** Gerentes, Recepcionistas e Sócios de Clínicas.
- **What:** Um software gerencial de alta performance.
- **Feel:** "Bold & Clarity". Passa segurança por ser limpo, porém extremamente moderno e impactante, semelhante a produtos premium de fintech. Não é um aplicativo de meditação (soft), mas uma ferramenta de gestão poderosa.

## 2. Layout & Spacing
- **Container Scale:** Generous. Uso de `space-y-8` e `pb-10` ou `pb-12` em grandes seções.
- **Animations:** A entrada principal das páginas *sempre* deve ter `animate-in fade-in duration-500`.

## 3. Typography (The Signature)
A assinatura desse design é a Tipografia Massiva e os gradientes textuais de alto contraste em vez da cor sólida.

- **Page Titles (h1):**
  - **Classes:** `text-4xl md:text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-gray-100 dark:to-gray-500 pr-2 pb-1`
  - Sempre acompanhado de um subtítulo `text-muted-foreground font-medium mt-1`.
- **Card Titles:**
  - `text-lg font-bold flex items-center gap-2`.
- **Metrics/Hero Numbers:**
  - `text-5xl md:text-7xl font-black tracking-tighter`.

## 4. Surfaces & Depth
- **Borda vs Sombra:** O foco está na Borda e no Background colorido suave, não em grandes sombras soltas (drop shadows).
- **Cards Padrão:** `shadow-sm border-muted/60` (Borda fina, sombra leve).
- **Cards Internos (Listas/Grids):** `bg-muted/30 p-4 rounded-xl border border-muted/50 transition-colors hover:bg-muted/50`. Nada de fundos brancos sem borda saltando. Sempre contidos com respiro.
- **Hero Cards (Opcional por tela):** Fundo super denso (`bg-gradient-to-br from-slate-900 to-black text-white`) com mix-blend de ruído transparente.

## 5. Forms & Inputs
- **Inputs:** `h-10` ou `h-11 shadow-sm font-medium`. Labels com `text-sm font-semibold`. Seções categorizadas com divisórias minimalistas.
- **Scroll Fix:** O comportamento de wheel scroll nativo de inputs `type="number"` fica bloqueado/corrigido globalmente para evitar bugs de formulário.

## Regra de Ouro da Unificação:
1. Substituir todos os `h1` clássicos pelo componente de `h1` em gradiente transparente com "Massive Typography".
2. Substituir todas as "filas de tabelas infinitas" (onde aplicável) ou listas em branco por Cards bem contornados.
3. Não criar sombras macabras e grandes (`shadow-xl` ou mais fortes em conteúdo corriqueiro), o minimalismo da borda `border-muted/50` deve brilhar!
