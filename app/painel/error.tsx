'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="private-card" role="alert"><h1>Não conseguimos carregar esta página</h1><p>Se você acabou de salvar algo, confira o resultado após recarregar antes de repetir a operação.</p><button onClick={reset}>Tentar novamente</button></section>; }
