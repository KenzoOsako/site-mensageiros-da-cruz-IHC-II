'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteNav() {
  const pathname = usePathname();
  const current = (href: string) => pathname === href ? 'page' as const : undefined;
  return <nav aria-label="Navegação principal"><Link href="/#sobre">O grupo</Link><Link href="/previa" aria-current={current('/previa')}>Conhecer a prévia</Link><a className="button button-small" href="/entrar" aria-current={current('/entrar')}>Área do grupo</a></nav>;
}
