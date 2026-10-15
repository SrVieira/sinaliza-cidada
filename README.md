# Sinaliza Cidadã

PWA comunitária e sem fins lucrativos para apoiar decisões de deslocamento, reunir relatos urbanos e facilitar o acesso a serviços de emergência.

## Estado do MVP

- mapa interativo com camadas demonstrativas, relatos locais e dados da API quando configurada;
- busca de destino e análise contextual de rota;
- envio de relato comunitário com privacidade por padrão;
- central de emergência e compartilhamento de localização;
- contatos de confiança salvos somente no dispositivo;
- instalação como PWA e suporte offline para a interface;
- contexto de atenção calculado pela API a partir de fonte, gravidade, recência, distância e confirmações;
- telefones de emergência carregados do backend com fallback local;
- linguagem de risco responsável: o produto não garante a segurança de nenhuma região.

Sem `VITE_API_URL`, os eventos exibidos são demonstrações claramente identificadas. Com a API configurada, a PWA troca automaticamente para ocorrências publicadas e moderadas da área consultada.

## Desenvolvimento

```bash
npm install
cp .env.example .env
npm run dev
```

O backend local deve estar disponível em `http://localhost:3333`. Para outro ambiente, altere `VITE_API_URL`.

## Produção

```bash
npm run build
npm run preview
```

## Privacidade

Contatos de confiança e relatos ainda não autenticados ficam no `localStorage` do navegador. A localização só é solicitada por ação explícita. Quando a API está configurada, as coordenadas são enviadas para consultar ocorrências e contexto próximos; respostas públicas usam localização aproximada dos relatos e nunca identificam o autor.
