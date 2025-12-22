'use client';

interface ShortcutsMenuProps {
  onSelect: (shortcut: string) => void;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    command: '/mark unknown: ',
    description: 'Marcar palavras desconhecidas',
    example: '/mark unknown: inferir, evidência',
  },
  {
    command: '/checkpoint: ',
    description: 'Responder checkpoint',
    example: '/checkpoint: A ideia principal é...',
  },
  {
    command: '/keyidea: ',
    description: 'Marcar ideia-chave',
    example: '/keyidea: Conceito de aprendizagem ativa',
  },
  {
    command: '/production: ',
    description: 'Submeter produção',
    example: '/production: [texto produzido]',
  },
];

/**
 * ShortcutsMenu - Quick command reference panel
 * Shows available /commands with examples
 */
export function ShortcutsMenu({ onSelect, onClose }: ShortcutsMenuProps) {
  return (
    <div className="shortcuts-menu">
      <div className="shortcuts-header">
        <h3>Comandos Rápidos</h3>
        <button
          onClick={onClose}
          className="shortcuts-close"
          aria-label="Fechar menu"
        >
          ✕
        </button>
      </div>

      <div className="shortcuts-list">
        {SHORTCUTS.map((shortcut, index) => (
          <div key={index} className="shortcut-item">
            <button
              onClick={() => onSelect(shortcut.command)}
              className="shortcut-button"
            >
              <div className="shortcut-command">
                <code>{shortcut.command}</code>
              </div>
              <div className="shortcut-description">
                {shortcut.description}
              </div>
              <div className="shortcut-example">
                <em>Ex: {shortcut.example}</em>
              </div>
            </button>
          </div>
        ))}
      </div>

      <div className="shortcuts-footer">
        <p className="text-sm text-gray-500">
          Clique em um comando para adicioná-lo ao campo de texto
        </p>
      </div>
    </div>
  );
}
