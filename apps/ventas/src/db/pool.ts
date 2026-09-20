export interface FilaDeConsulta {
  [columna: string]: unknown;
}

export interface ResultadoDeConsulta {
  rows: FilaDeConsulta[];
}

export interface Consultable {
  query(sql: string, parametros?: readonly unknown[]): Promise<ResultadoDeConsulta>;
}
