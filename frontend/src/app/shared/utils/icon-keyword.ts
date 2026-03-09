const KEYWORD_ICON_RULES: Array<{ icon: string; keywords: string[] }> = [
  { icon: 'database', keywords: ['data', 'database', 'sql', 'mysql', 'postgres', 'mongodb', 'mongo', 'db', 'etl'] },
  { icon: 'cloud', keywords: ['cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'k8s', 'docker', 'devops'] },
  { icon: 'server', keywords: ['backend', 'api', 'server', 'django', 'flask', 'node', 'spring', 'fastapi'] },
  { icon: 'code', keywords: ['frontend', 'angular', 'react', 'vue', 'javascript', 'typescript', 'js', 'ts', 'html', 'css'] },
  { icon: 'cpu', keywords: ['ai', 'ml', 'machine learning', 'deep learning', 'python', 'pandas', 'numpy'] },
  { icon: 'chart', keywords: ['analytics', 'bi', 'tableau', 'power bi', 'reporting', 'dashboard'] }
];

const DIRECT_ICON_ALIASES: Record<string, string> = {
  coding: 'code',
  program: 'code',
  programme: 'code',
  dev: 'code',
  data: 'database',
  base: 'database',
  bdd: 'database',
  serveur: 'server',
  backend: 'server',
  infra: 'cloud',
  ia: 'cpu',
  chart: 'chart',
  graph: 'chart',
  graphe: 'chart'
};

const DEFAULT_ICON = 'settings';

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function resolveIconFromKeyword(rawValue: string | undefined | null): string {
  const value = normalize(rawValue ?? '');
  if (!value) {
    return DEFAULT_ICON;
  }

  if (DIRECT_ICON_ALIASES[value]) {
    return DIRECT_ICON_ALIASES[value];
  }

  for (const rule of KEYWORD_ICON_RULES) {
    if (rule.keywords.some((keyword) => value.includes(keyword))) {
      return rule.icon;
    }
  }

  return DEFAULT_ICON;
}

export const ICON_SUGGESTIONS = ['code', 'database', 'cloud', 'server', 'cpu', 'chart', 'settings'];
