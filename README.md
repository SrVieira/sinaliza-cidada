# Sinaliza Cidadã

PWA comunitária e sem fins lucrativos para apoiar decisões de deslocamento, reunir relatos urbanos e facilitar o acesso a serviços de emergência.

## Estado do MVP

- mapa interativo com camadas demonstrativas e relatos locais;
- busca de destino e análise contextual de rota;
- envio de relato comunitário com privacidade por padrão;
- central de emergência e compartilhamento de localização;
- contatos de confiança salvos somente no dispositivo;
- instalação como PWA e suporte offline para a interface;
- linguagem de risco responsável: o produto não garante a segurança de nenhuma região.

Os eventos exibidos inicialmente são demonstrações claramente identificadas. A integração com fontes oficiais e armazenamento compartilhado será feita em uma próxima etapa, mediante convênios, revisão da LGPD e definição de governança.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Produção

```bash
npm run build
npm run preview
```

## Privacidade

Relatos e contatos criados nesta versão ficam no `localStorage` do navegador. A localização precisa só é solicitada por ação explícita do usuário e não é enviada a um servidor próprio.
