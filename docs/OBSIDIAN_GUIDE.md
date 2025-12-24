# Usando Obsidian com esta Documentação

A pasta `docs/` foi estruturada para ser compatível com ferramentas modernas de Knowledge Base como o **Obsidian**.

## O Que é Obsidian?

É um editor de Markdown que trata sua pasta de arquivos como um "Cérebro Digital", permitindo links bidirecionais, gráficos de conexão e tags.

## Como Configurar

1.  **Instale o Obsidian**: [obsidian.md](https://obsidian.md/)
2.  **Abra o Vault**:
    - Clique em "Open folder as vault".
    - Selecione a pasta `docs/` deste repositório.
3.  **Pronto!** Você agora pode navegar, buscar e editar a documentação com recursos avançados.

## Recursos Úteis no Obsidian

### Links

Use `[[Nome do Arquivo]]` para criar links rápidos entre documentos. A estrutura atual já usa links relativos padrão Markdown `[Label](path/file.md)`, que o Obsidian também entende.

### Graph View

Visualize como os documentos se conectam. Útil para ver quais ADRs afetam quais componentes da Arquitetura.

### Templates

Você pode configurar a pasta `docs/ADRs/` como pasta de templates no Obsidian para criar novos ADRs rapidamente usando o `0001-template.md`.

## Dica para VS Code

Se preferir ficar no VS Code, instale a extensão **Foam** ou **Markdown Memo** para ter recursos similares de wiki links e graph visualization.
