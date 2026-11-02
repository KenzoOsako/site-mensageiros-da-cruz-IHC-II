'use client';

// Browser validation stays on, but its messages are replaced by Portuguese ones that say how to fix the field.
function explain(event: React.InvalidEvent<HTMLInputElement>) {
  const field = event.currentTarget;
  if (field.validity.valueMissing) field.setCustomValidity(field.type === 'email' ? 'Digite o e-mail com que você recebeu o convite.' : 'Digite sua senha.');
  else if (field.validity.typeMismatch) field.setCustomValidity('Confira o e-mail: ele precisa ter @ e um domínio, como nome@exemplo.com.');
}
const clear = (event: React.FormEvent<HTMLInputElement>) => event.currentTarget.setCustomValidity('');

export function LoginFields() {
  return <><label>E-mail<input name="email" type="email" required autoComplete="email" maxLength={254} onInvalid={explain} onInput={clear} /></label><label>Senha<input name="password" type="password" required autoComplete="current-password" maxLength={128} onInvalid={explain} onInput={clear} /></label></>;
}
