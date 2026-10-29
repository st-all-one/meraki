/**
 * Porta entre módulos. O consumidor declara a forma; o dono publica no
 * manifesto. O executor explícito permite participar da transação do chamador.
 */
export interface Port<Input, Output> {
  execute(input: Input): Output;
}
