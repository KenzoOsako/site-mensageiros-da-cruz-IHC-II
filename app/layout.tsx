import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/site-nav';
import './globals.css';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mensageiros da Cruz Tupã | Juventude em Ação',
  description: 'Fé, encontro e solidariedade. Conheça os Mensageiros da Cruz Tupã, da Paróquia São Pedro Apóstolo.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body id="topo">
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header className="site-header"><div className="header-inner">
      <Link className="brand" href="/" aria-label="Mensageiros da Cruz Tupã — início"><span className="brand-symbol" aria-hidden="true">✚</span><span>Mensageiros da Cruz<small>TUPÃ · PARÓQUIA SÃO PEDRO APÓSTOLO</small></span></Link>
      <SiteNav />
    </div></header>
    <main id="conteudo">{children}</main>
    <footer className="site-footer"><div><strong>Mensageiros da Cruz Tupã</strong><p>Paróquia São Pedro Apóstolo</p></div><p>Juventude em Ação · Projeto em desenvolvimento</p><a href="#topo">Voltar ao topo da página ↑</a></footer>
  </body></html>;
}
