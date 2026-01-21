import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client';
import {
  ArrowLeft,
  Save,
  Eye,
  Undo,
  Redo,
  Smartphone,
  Tablet,
  Monitor,
  Trash2,
  Settings,
  Layers,
  Type,
  Image,
  Square,
  MousePointer,
  Layout,
  Navigation,
  FileText,
  Grid3X3,
  GripVertical,
  Loader2,
  Sparkles,
  Download,
  Rocket,
} from 'lucide-react';
import PreviewModal from '../components/builder/PreviewModal';
import PageManager from '../components/builder/PageManager';
import ExportModal from '../components/builder/ExportModal';

interface Page {
  id: string;
  name: string;
  slug: string;
  is_homepage: boolean | null;
}

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

const COMPONENT_LIBRARY = [
  { type: 'section', icon: Layout, label: 'Section', category: 'Layout' },
  { type: 'container', icon: Square, label: 'Conteneur', category: 'Layout' },
  { type: 'grid', icon: Grid3X3, label: 'Grille', category: 'Layout' },
  { type: 'header', icon: Navigation, label: 'En-tête', category: 'Navigation' },
  { type: 'navbar', icon: Navigation, label: 'Barre Nav', category: 'Navigation' },
  { type: 'footer', icon: FileText, label: 'Pied de page', category: 'Navigation' },
  { type: 'hero', icon: Sparkles, label: 'Hero', category: 'Contenu' },
  { type: 'text', icon: Type, label: 'Texte', category: 'Contenu' },
  { type: 'image', icon: Image, label: 'Image', category: 'Contenu' },
  { type: 'button', icon: MousePointer, label: 'Bouton', category: 'Contenu' },
  { type: 'card', icon: Square, label: 'Carte', category: 'Contenu' },
  { type: 'form', icon: FileText, label: 'Formulaire', category: 'Contenu' },
];

type ComponentType = "button" | "card" | "container" | "custom" | "footer" | "form" | "grid" | "header" | "hero" | "image" | "navbar" | "section" | "text";

export default function Builder() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<{ name: string; description: string | null } | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [leftPanelTab, setLeftPanelTab] = useState<'components' | 'layers'>('components');
  const [showPreview, setShowPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectData(projectId);
    }
  }, [projectId]);

  const fetchProjectData = async (id: string) => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      const { data: pagesData, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .eq('project_id', id)
        .order('created_at');

      if (pagesError) throw pagesError;
      setPages((pagesData || []) as Page[]);

      const homepage = pagesData?.find((p) => p.is_homepage) || pagesData?.[0];
      if (homepage) {
        setCurrentPage(homepage as Page);
        fetchComponents(homepage.id);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Erreur lors du chargement du projet');
    } finally {
      setLoading(false);
    }
  };

  const fetchComponents = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .eq('page_id', pageId)
        .order('order_index');

      if (error) throw error;
      setComponents((data || []) as Component[]);
      setSelectedComponent(null);
    } catch (error) {
      console.error('Error fetching components:', error);
    }
  };

  const addComponent = async (type: string) => {
    if (!currentPage) return;

    try {
      const newComponent = {
        page_id: currentPage.id,
        component_type: type as ComponentType,
        name: `${type}-${Date.now()}`,
        order_index: components.length,
        props: getDefaultProps(type) as Record<string, unknown>,
        styles: getDefaultStyles(type) as Record<string, unknown>,
        content: getDefaultContent(type) as Record<string, unknown>,
      };

      const { data, error } = await supabase.from('components').insert([newComponent as any]).select().single();

      if (error) throw error;

      const typedData = data as Component;
      setComponents([...components, typedData]);
      setSelectedComponent(typedData);
      toast.success('Composant ajouté');
    } catch (error) {
      console.error('Error adding component:', error);
      toast.error("Erreur lors de l'ajout du composant");
    }
  };

  const deleteComponent = async (componentId: string) => {
    try {
      const { error } = await supabase.from('components').delete().eq('id', componentId);

      if (error) throw error;

      setComponents(components.filter((c) => c.id !== componentId));
      if (selectedComponent?.id === componentId) {
        setSelectedComponent(null);
      }
      toast.success('Composant supprimé');
    } catch (error) {
      console.error('Error deleting component:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const updateComponent = async (componentId: string, updates: Partial<Component>) => {
    try {
      const { error } = await supabase.from('components').update(updates as any).eq('id', componentId);

      if (error) throw error;

      setComponents(components.map((c) => (c.id === componentId ? { ...c, ...updates } : c)));
      if (selectedComponent?.id === componentId) {
        setSelectedComponent({ ...selectedComponent, ...updates });
      }
    } catch (error) {
      console.error('Error updating component:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const saveProject = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      await supabase.from('projects').update({ updated_at: new Date().toISOString() }).eq('id', projectId);
      toast.success('Projet sauvegardé');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePageSelect = (page: Page) => {
    setCurrentPage(page);
    fetchComponents(page.id);
  };

  const getDefaultProps = (type: string): Record<string, unknown> => {
    const defaults: Record<string, Record<string, unknown>> = {
      hero: { title: 'Bienvenue', subtitle: 'Découvrez notre site', cta: 'Commencer' },
      text: { content: 'Votre texte ici' },
      button: { label: 'Cliquez-moi', variant: 'primary' },
      image: { src: '', alt: 'Image description' },
      card: { title: 'Titre', description: 'Description' },
      section: { fullWidth: false },
      container: { maxWidth: '1200px' },
      grid: { columns: 3, gap: '1rem' },
      navbar: { logo: 'Logo', links: [] },
      header: { sticky: true },
      footer: { copyright: '© 2024' },
      form: { fields: [] },
    };
    return defaults[type] || {};
  };

  const getDefaultStyles = (type: string): Record<string, unknown> => {
    const defaults: Record<string, Record<string, unknown>> = {
      section: { padding: '4rem 0', backgroundColor: 'transparent' },
      hero: { minHeight: '80vh', textAlign: 'center' },
      container: { padding: '1rem' },
      text: { fontSize: '1rem', color: 'inherit' },
      button: { padding: '0.75rem 1.5rem', borderRadius: '0.5rem' },
    };
    return defaults[type] || {};
  };

  const getDefaultContent = (type: string): Record<string, unknown> => {
    return {};
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-sm';
      case 'tablet':
        return 'max-w-2xl';
      default:
        return 'w-full';
    }
  };

  const renderComponent = (component: Component) => {
    const isSelected = selectedComponent?.id === component.id;
    const baseClasses = `relative group cursor-pointer transition-all ${
      isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-2 hover:ring-primary/50'
    }`;

    const styles = component.styles as Record<string, string>;
    const props = component.props as Record<string, string>;

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedComponent(component);
    };

    switch (component.component_type) {
      case 'hero':
        return (
          <div
            key={component.id}
            onClick={handleClick}
            className={`${baseClasses} min-h-[400px] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/10 to-primary/5`}
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
          <section key={component.id} onClick={handleClick} className={`${baseClasses} p-8`} style={styles}>
            <div className="text-center text-muted-foreground py-12 border-2 border-dashed border-border rounded-lg">
              Section - Glissez des composants ici
            </div>
          </section>
        );

      case 'text':
        return (
          <p key={component.id} onClick={handleClick} className={`${baseClasses} p-4`} style={styles}>
            {props.content || 'Texte à modifier'}
          </p>
        );

      case 'button':
        return (
          <div key={component.id} onClick={handleClick} className={`${baseClasses} inline-block p-2`}>
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
            onClick={handleClick}
            className={`${baseClasses} p-6 bg-card border border-border rounded-xl`}
            style={styles}
          >
            <h3 className="text-lg font-semibold mb-2">{props.title || 'Titre de carte'}</h3>
            <p className="text-muted-foreground">{props.description || 'Description de la carte'}</p>
          </div>
        );

      case 'image':
        return (
          <div key={component.id} onClick={handleClick} className={`${baseClasses} p-4`}>
            {props.src ? (
              <img src={props.src} alt={props.alt || ''} className="max-w-full rounded-lg" style={styles} />
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Image className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        );

      case 'navbar':
        return (
          <nav
            key={component.id}
            onClick={handleClick}
            className={`${baseClasses} flex items-center justify-between p-4 bg-card border-b border-border`}
            style={styles}
          >
            <span className="font-bold text-lg">{props.logo || 'Logo'}</span>
            <div className="flex gap-4">
              <span className="text-muted-foreground">Lien 1</span>
              <span className="text-muted-foreground">Lien 2</span>
              <span className="text-muted-foreground">Lien 3</span>
            </div>
          </nav>
        );

      case 'footer':
        return (
          <footer
            key={component.id}
            onClick={handleClick}
            className={`${baseClasses} p-8 bg-muted text-center`}
            style={styles}
          >
            <p className="text-muted-foreground">{props.copyright || '© 2024 Votre site'}</p>
          </footer>
        );

      case 'grid':
        return (
          <div
            key={component.id}
            onClick={handleClick}
            className={`${baseClasses} grid grid-cols-3 gap-4 p-4`}
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
            onClick={handleClick}
            className={`${baseClasses} p-8 bg-muted/50 rounded-lg text-center`}
          >
            <p className="text-muted-foreground">{component.component_type}</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Toolbar */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold">{project?.name || 'Projet'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Undo className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Redo className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Prévisualiser"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Exporter"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={saveProject}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Sauvegarder
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Components Library */}
        <aside className="w-64 bg-card border-r border-border flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex border-b border-border">
            <button
              onClick={() => setLeftPanelTab('components')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                leftPanelTab === 'components'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Composants
            </button>
            <button
              onClick={() => setLeftPanelTab('layers')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                leftPanelTab === 'layers'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Calques
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {leftPanelTab === 'components' ? (
              <div className="space-y-4">
                {['Layout', 'Navigation', 'Contenu'].map((category) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {category}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {COMPONENT_LIBRARY.filter((c) => c.category === category).map((comp) => (
                        <button
                          key={comp.type}
                          onClick={() => addComponent(comp.type)}
                          className="flex flex-col items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                        >
                          <comp.icon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs">{comp.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {components.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun composant sur cette page
                  </p>
                ) : (
                  components.map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedComponent(comp)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        selectedComponent?.id === comp.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <Layers className="h-4 w-4" />
                      <span className="text-sm flex-1 truncate">
                        {comp.name || comp.component_type}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteComponent(comp.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-destructive rounded transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Pages Section */}
          <PageManager
            pages={pages}
            currentPage={currentPage}
            projectId={projectId || ''}
            onPageSelect={handlePageSelect}
            onPagesChange={setPages}
          />
        </aside>

        {/* Canvas / Preview */}
        <main
          className="flex-1 overflow-auto bg-muted/30 p-8"
          onClick={() => setSelectedComponent(null)}
        >
          <div className={`mx-auto ${getViewportWidth()} min-h-full bg-background rounded-lg shadow-xl overflow-hidden`}>
            {components.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8">
                <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Layout className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Page vide</h3>
                <p className="text-muted-foreground mb-6">
                  Ajoutez des composants depuis le panneau de gauche
                </p>
              </div>
            ) : (
              <div className="min-h-[600px]">{components.map(renderComponent)}</div>
            )}
          </div>
        </main>

        {/* Right Panel - Properties */}
        <aside className="w-72 bg-card border-l border-border flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Propriétés
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedComponent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedComponent.component_type}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nom</label>
                  <input
                    type="text"
                    value={selectedComponent.name || ''}
                    onChange={(e) =>
                      updateComponent(selectedComponent.id, { name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Dynamic props based on component type */}
                {Object.entries(selectedComponent.props as Record<string, string>).map(
                  ([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-2 capitalize">{key}</label>
                      <input
                        type="text"
                        value={value || ''}
                        onChange={(e) =>
                          updateComponent(selectedComponent.id, {
                            props: { ...selectedComponent.props, [key]: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  )
                )}

                <div className="pt-4 border-t border-border">
                  <button
                    onClick={() => deleteComponent(selectedComponent.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg font-medium hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <MousePointer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sélectionnez un composant pour modifier ses propriétés</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Modals */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        components={components}
        projectName={project?.name || 'Projet'}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        projectId={projectId || ''}
        projectName={project?.name || 'Projet'}
        pages={pages}
      />
    </div>
  );
}
