import Link from 'next/link';

export const metadata = { title: 'Página não encontrada | Mensageiros da Cruz Tupã' };

export default function NotFound() {
  return <section className="section not-found"><span className="eyebrow">ERRO 404</span><h1>Não encontramos esta página.</h1><p>O endereço pode ter sido digitado errado ou a página mudou de lugar. Confira o endereço ou siga por um destes caminhos:</p><div className="button-row"><Link className="button" href="/">Voltar ao início</Link><Link className="text-link" href="/previa">Conhecer a prévia →</Link></div></section>;
}
