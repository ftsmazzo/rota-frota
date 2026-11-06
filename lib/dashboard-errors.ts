export function dashboardErrorMessage(error:unknown){
  const name=(error as Error)?.name||'';
  const message=(error as Error)?.message||'';
  if(name==='SyntaxError'||/expected pattern|JSON Parse|Unexpected (?:end|token)|JSON input/i.test(message))return 'O serviço não enviou uma resposta válida para a leitura. Tente novamente.';
  if(name==='TypeError'||/Load failed|Failed to fetch|NetworkError/i.test(message))return 'Não foi possível completar a conexão. Verifique a internet e tente novamente.';
  return message||'Não foi possível ler a foto. Tente novamente.';
}
