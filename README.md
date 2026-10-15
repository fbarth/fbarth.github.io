# Site pessoal de Fabrício J. Barth

Site acadêmico estático, em português e inglês, com pesquisa, publicações,
projetos e materiais de ensino. Publicado pelo GitHub Pages, sem etapa de build,
framework ou dependências de produção.

## Estrutura e manutenção

- `index.html` e `en/index.html`: apresentação, linhas de pesquisa e seleção
  editorial de publicações recentes.
- `projetos.html` e `en/projetos.html`: pesquisa ativa e arquivo de projetos.
- `publicacoes.html` e `en/publicacoes.html`: referências completas por ano.
- `materiais.html` e `en/materiais.html`: categorias de recursos de ensino.
- `contatos.html` e `en/contatos.html`: contato e perfis externos.
- `default.css`: identidade visual e regras responsivas compartilhadas.
  `en/default.css` é um link simbólico para esse arquivo, mantido por compatibilidade.
- `docs/`, `materiais/` e `projetos/`: documentos e páginas de conteúdo.

As 57 páginas do modelo principal compartilham cabeçalho, rodapé e navegação.
O menu móvel usa `<details>` e funciona sem JavaScript. Os arquivos independentes
exportados de aulas/notebooks e a página histórica em `404html/` não usam esse
modelo e mantêm sua apresentação original.

Ao atualizar o site:

1. Atualize as versões em português e inglês quando houver página equivalente.
2. Nas publicações, acrescente uma entrada à lista do ano correspondente. Para
   um ano novo, crie a seção `year-AAAA`, seu título `heading-AAAA` e o atalho na
   navegação de anos. Preserve autores, veículo, DOI e links para documentos.
3. A seleção de três publicações na página inicial é manual. Atualize ambas as
   páginas iniciais se quiser mudar os destaques.
4. Use caminhos relativos e preserve os endereços existentes. Na versão em
   inglês, documentos do arquivo compartilhado podem usar `../docs/` ou
   `../../docs/`, conforme a profundidade da página.
5. Em novas páginas, copie a estrutura de uma página do mesmo nível, ajuste
   título, descrição, idioma, navegação ativa e link para a tradução. Mantenha
   um único `<h1>` e o destino `main-content` do link de acessibilidade.

## Visualização local

Abra `index.html` no navegador ou, com Ruby disponível, sirva o diretório:

```sh
ruby -run -e httpd . -p 8765 -b 127.0.0.1
```

Acesse `http://127.0.0.1:8765/`.

## Verificação

Os testes estruturais não exigem instalar pacotes; utilizam Node.js 18 ou superior:

```sh
node --test tests/site.test.cjs
git diff --check
```

Para alterações visuais, confira também as páginas principais e páginas internas
em telas de 320, 390, 768 e 1440 px, sem rolagem horizontal. Verifique o menu móvel,
a troca de idioma, a navegação por teclado, o link de pular para o conteúdo e os
atalhos de ano. Os testes não verificam a disponibilidade de sites externos.
