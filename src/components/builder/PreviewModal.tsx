import { X, ExternalLink, Monitor, Tablet, Smartphone } from 'lucide-react';
import { useState } from 'react';

interface Component {
  id: string;
  page_id: string;
  parent_id: string | null;
  component_type: string;
  name: string | null;
  props: Record<string, unknown> | null;
  styles: Record<string, unknown> | null;
  content: Record<string, unknown> | null;
  order_index: number;
  is_visible: boolean | null;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: Component[];
  projectName: string;
}

export default function PreviewModal({ isOpen, onClose, components, projectName }: PreviewModalProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  if (!isOpen) return null;

  const getViewportClass = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-sm';
      case 'tablet':
        return 'max-w-2xl';
      default:
        return 'max-w-full';
    }
  };

  const renderPreviewComponent = (component: Component) => {
    const styles = component.styles as Record<string, string>;
    const props = component.props as Record<string, string>;

    switch (component.component_type) {
      case 'hero':
        return (
          <div
            key={component.id}
            className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/10 to-primary/5"
            style={styles}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{props.title || 'Titre Hero'}</h1>
            <p className="text-xl text-muted-foreground mb-8">{props.subtitle || 'Sous-titre'}</p>
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium">
              {props.cta || 'Action'}
            </button>
          </div>
        );

      case 'section':
        return (
          <section key={component.id} className="p-8" style={styles}>
            <div className="text-center text-muted-foreground py-12 border-2 border-dashed border-border rounded-lg">
              Section vide
            </div>
          </section>
        );

      case 'text':
        return (
          <p key={component.id} className="p-4" style={styles}>
            {props.content || 'Texte'}
          </p>
        );

      case 'button':
        return (
          <div key={component.id} className="p-2">
            <button
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
              style={styles}
            >
              {props.label || 'Bouton'}
            </button>
          </div>
        );

      case 'card':
        return (
          <div
            key={component.id}
            className="p-6 bg-card border border-border rounded-xl m-4"
            style={styles}
          >
            <h3 className="text-lg font-semibold mb-2">{props.title || 'Titre de carte'}</h3>
            <p className="text-muted-foreground">{props.description || 'Description de la carte'}</p>
          </div>
        );

      case 'image':
        return (
          <div key={component.id} className="p-4">
            {props.src ? (
              <img src={props.src} alt={props.alt || ''} className="max-w-full rounded-lg" style={styles} />
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Image placeholder</span>
              </div>
            )}
          </div>
        );

      case 'navbar':
        return (
          <nav
            key={component.id}
            className="flex items-center justify-between p-4 bg-card border-b border-border"
            style={styles}
          >
            <span className="font-bold text-lg">{props.logo || 'Logo'}</span>
            <div className="flex gap-4">
              <span className="text-muted-foreground hover:text-foreground cursor-pointer">Lien 1</span>
              <span className="text-muted-foreground hover:text-foreground cursor-pointer">Lien 2</span>
              <span className="text-muted-foreground hover:text-foreground cursor-pointer">Lien 3</span>
            </div>
          </nav>
        );

      case 'footer':
        return (
          <footer
            key={component.id}
            className="p-8 bg-muted text-center"
            style={styles}
          >
            <p className="text-muted-foreground">{props.copyright || '© 2024 Votre site'}</p>
          </footer>
        );

      case 'grid':
        return (
          <div
            key={component.id}
            className="grid grid-cols-3 gap-4 p-4"
            style={styles}
          >
            <div className="aspect-square bg-muted rounded-lg"></div>
            <div className="aspect-square bg-muted rounded-lg"></div>
            <div className="aspect-square bg-muted rounded-lg"></div>
          </div>
        );

      default:
        return (
          <div
            key={component.id}
            className="p-8 bg-muted/50 rounded-lg text-center"
          >
            <p className="text-muted-foreground">{component.component_type}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Prévisualisation: {projectName}</h2>
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-2 rounded-md transition-colors ${
                viewport === 'desktop' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
              }`}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-2 rounded-md transition-colors ${
                viewport === 'tablet' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
              }`}
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-2 rounded-md transition-colors ${
                viewport === 'mobile' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
              }`}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto p-8 flex justify-center">
        <div className={`${getViewportClass()} w-full bg-background rounded-lg shadow-2xl overflow-hidden`}>
          {components.length === 0 ? (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
              Aucun composant à afficher
            </div>
          ) : (
            components.map(renderPreviewComponent)
          )}
        </div>
      </div>
    </div>
  );
}
