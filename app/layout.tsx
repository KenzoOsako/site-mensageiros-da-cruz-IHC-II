import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mensageiros da Cruz Tupã | Juventude em Ação',
  description: 'Fé, encontro e solidariedade. Conheça os Mensageiros da Cruz Tupã, da Paróquia São Pedro Apóstolo.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header className="site-header"><div className="header-inner">
      <Link className="brand" href="/" aria-label="Mensageiros da Cruz Tupã — início"><span className="brand-symbol" aria-hidden="true">✚</span><span>Mensageiros da Cruz<small>TUPÃ · PARÓQUIA SÃO PEDRO APÓSTOLO</small></span></Link>
      <nav aria-label="Navegação principal"><Link href="/#sobre">O grupo</Link><Link href="/previa">Conhecer a prévia</Link><Link className="button button-small" href="/entrar">Área do grupo <span aria-hidden="true">↗</span></Link></nav>
    </div></header>
    <main id="conteudo">{children}</main>
    <footer className="site-footer"><div><strong>Mensageiros da Cruz Tupã</strong><p>Paróquia São Pedro Apóstolo</p></div><p>Juventude em Ação · Projeto em desenvolvimento</p><Link href="/">Voltar ao início ↑</Link></footer>
  </body></html>;
}
