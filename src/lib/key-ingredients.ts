/**
 * Localized display names for KEY INGREDIENTS on recommendation cards.
 *
 * Seed products store ingredient names in English ("oat extract", "matrixyl
 * 3000"); the UI previously showed them raw, so Chinese users saw English
 * mid-sentence (user feedback 2026-07-10). This maps every ingredient string
 * used by the seed catalogue (plus common AI-generated ones) to zh-TW / zh-CN.
 * Unmapped values fall back to the capitalized raw string, so AI-generated
 * ingredients that arrive already localized pass through unchanged.
 *
 * Distinct from src/lib/ingredient-names.ts, which localizes FLAGGED (warning)
 * INCI names — different vocabulary, different tone (marketing vs caution).
 */

const MAP: Record<string, { zhTW: string; zhCN: string }> = {
  '9 peptide complex':            { zhTW: '九胜肽複合物', zhCN: '九胜肽复合物' },
  'egf':                          { zhTW: '生長因子 EGF', zhCN: '生长因子 EGF' },
  'gaba':                         { zhTW: 'GABA（γ-胺基丁酸）', zhCN: 'GABA（γ-氨基丁酸）' },
  'adapalene (retinoid)':         { zhTW: '阿達帕林（A酸類）', zhCN: '阿达帕林（A酸类）' },
  'aloe bioferment':              { zhTW: '蘆薈發酵萃取', zhCN: '芦荟发酵萃取' },
  'alpha arbutin':                { zhTW: '熊果素', zhCN: '熊果苷' },
  'argireline':                   { zhTW: '六胜肽（Argireline）', zhCN: '六胜肽（Argireline）' },
  'azelaic acid':                 { zhTW: '杜鵑花酸', zhCN: '壬二酸' },
  'benzoyl peroxide':             { zhTW: '過氧化苯甲醯', zhCN: '过氧化苯甲酰' },
  'betaine salicylate (bha)':     { zhTW: '甜菜鹼水楊酸（BHA）', zhCN: '甜菜碱水杨酸（BHA）' },
  'broad-spectrum filters':       { zhTW: '廣譜防曬劑', zhCN: '广谱防晒剂' },
  'caffeine':                     { zhTW: '咖啡因', zhCN: '咖啡因' },
  'centella asiatica':            { zhTW: '積雪草', zhCN: '积雪草' },
  'ceramides':                    { zhTW: '神經醯胺', zhCN: '神经酰胺' },
  'encapsulated retinol':         { zhTW: '包裹型 A醇', zhCN: '包裹型 A醇' },
  'ferulic acid':                 { zhTW: '阿魏酸', zhCN: '阿魏酸' },
  'ginseng':                      { zhTW: '人參萃取', zhCN: '人参萃取' },
  'heartleaf (houttuynia cordata)': { zhTW: '魚腥草萃取', zhCN: '鱼腥草萃取' },
  'hyaluronic acid':              { zhTW: '玻尿酸', zhCN: '玻尿酸' },
  'hydrogel':                     { zhTW: '水凝膠', zhCN: '水凝胶' },
  'leuphasyl':                    { zhTW: '五胜肽（Leuphasyl）', zhCN: '五胜肽（Leuphasyl）' },
  'matrixyl 3000':                { zhTW: '胜肽複合物 Matrixyl 3000', zhCN: '胜肽复合物 Matrixyl 3000' },
  'milk protein extract':         { zhTW: '牛奶蛋白萃取', zhCN: '牛奶蛋白萃取' },
  'mineral complex':              { zhTW: '礦物複合物', zhCN: '矿物复合物' },
  'multiple hyaluronic acids':    { zhTW: '多重玻尿酸', zhCN: '多重玻尿酸' },
  'niacinamide':                  { zhTW: '菸鹼醯胺（B3）', zhCN: '烟酰胺（B3）' },
  'oat extract':                  { zhTW: '燕麥萃取', zhCN: '燕麦萃取' },
  'panthenol':                    { zhTW: '泛醇（B5）', zhCN: '泛醇（B5）' },
  'probiotics':                   { zhTW: '益生菌', zhCN: '益生菌' },
  'retinol':                      { zhTW: 'A醇（視黃醇）', zhCN: 'A醇（视黄醇）' },
  'rice extract':                 { zhTW: '米萃取', zhCN: '大米萃取' },
  'salicylic acid (bha)':         { zhTW: '水楊酸（BHA）', zhCN: '水杨酸（BHA）' },
  'snail secretion filtrate':     { zhTW: '蝸牛黏液濾液', zhCN: '蜗牛黏液滤液' },
  'tretinoin':                    { zhTW: '維 A 酸（處方）', zhCN: '维 A 酸（处方）' },
  'vitamin c (l-ascorbic acid)':  { zhTW: '維他命C（左旋C）', zhCN: '维生素C（左旋C）' },
  'vitamin c derivative':         { zhTW: '維他命C衍生物', zhCN: '维生素C衍生物' },
  'vitamin c':                    { zhTW: '維他命C', zhCN: '维生素C' },
  'vitamin e':                    { zhTW: '維他命E', zhCN: '维生素E' },
  'white tea leaf water':         { zhTW: '白茶葉水', zhCN: '白茶叶水' },
  'zinc oxide':                   { zhTW: '氧化鋅', zhCN: '氧化锌' },
  'zinc':                         { zhTW: '鋅', zhCN: '锌' },
  // Common AI-generated replacement ingredients (routine-replacements /
  // recommendations) that aren't in the seed catalogue:
  'green tea extract':            { zhTW: '綠茶萃取', zhCN: '绿茶萃取' },
  'propolis extract':             { zhTW: '蜂膠萃取', zhCN: '蜂胶萃取' },
  'squalane':                     { zhTW: '角鯊烷', zhCN: '角鲨烷' },
  'tea tree oil':                 { zhTW: '茶樹精油', zhCN: '茶树精油' },
  'madecassoside':                { zhTW: '積雪草苷', zhCN: '积雪草苷' },
  'allantoin':                    { zhTW: '尿囊素', zhCN: '尿囊素' },
  'glycerin':                     { zhTW: '甘油', zhCN: '甘油' },
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

/** Localized key-ingredient label; falls back to the capitalized raw string. */
export function keyIngredientLabel(raw: string, lang: string): string {
  if (!raw) return raw
  const hit = MAP[raw.trim().toLowerCase()]
  if (hit) {
    if (lang === 'zh-TW') return hit.zhTW
    if (lang === 'zh-CN') return hit.zhCN
  }
  return capitalize(raw)
}
