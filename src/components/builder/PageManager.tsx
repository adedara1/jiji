import { useState } from 'react';
import { Plus, FileText, MoreVertical, Trash2, Edit2, Home, X, Loader2 } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

interface Page {
  id: string;
  name: string;
  slug: string;
  is_homepage: boolean | null;
}

interface PageManagerProps {
  pages: Page[];
  currentPage: Page | null;
  projectId: string;
  onPageSelect: (page: Page) => void;
  onPagesChange: (pages: Page[]) => void;
}

export default function PageManager({
  pages,
  currentPage,
  projectId,
  onPageSelect,
  onPagesChange,
}: PageManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [pageName, setPageName] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setPageName(name);
    if (!editingPage) {
      setPageSlug(generateSlug(name));
    }
  };

  const createPage = async () => {
    if (!pageName.trim()) {
      toast.error('Veuillez entrer un nom pour la page');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('pages')
        .insert([{
          project_id: projectId,
          name: pageName,
          slug: pageSlug || generateSlug(pageName),
          is_homepage: pages.length === 0,
        } as any])
        .select()
        .single();

      if (error) throw error;

      const newPages = [...pages, data as Page];
      onPagesChange(newPages);
      onPageSelect(data as Page);
      setShowModal(false);
      setPageName('');
      setPageSlug('');
      toast.success('Page créée avec succès');
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error('Erreur lors de la création de la page');
    } finally {
      setCreating(false);
    }
  };

  const updatePage = async () => {
    if (!editingPage || !pageName.trim()) return;

    setCreating(true);
    try {
      const { error } = await supabase
        .from('pages')
        .update({
          name: pageName,
          slug: pageSlug,
        })
        .eq('id', editingPage.id);

      if (error) throw error;

      const updatedPages = pages.map(p =>
        p.id === editingPage.id ? { ...p, name: pageName, slug: pageSlug } : p
      );
      onPagesChange(updatedPages);
      if (currentPage?.id === editingPage.id) {
        onPageSelect({ ...currentPage, name: pageName, slug: pageSlug });
      }
      setShowModal(false);
      setEditingPage(null);
      setPageName('');
      setPageSlug('');
      toast.success('Page mise à jour');
    } catch (error) {
      console.error('Error updating page:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setCreating(false);
    }
  };

  const deletePage = async (pageId: string) => {
    if (!confirm('Supprimer cette page et tous ses composants ?')) return;

    try {
      // Delete components first
      await supabase.from('components').delete().eq('page_id', pageId);
      
      // Then delete the page
      const { error } = await supabase.from('pages').delete().eq('id', pageId);
      if (error) throw error;

      const remainingPages = pages.filter(p => p.id !== pageId);
      onPagesChange(remainingPages);
      
      if (currentPage?.id === pageId && remainingPages.length > 0) {
        onPageSelect(remainingPages[0]);
      }
      
      toast.success('Page supprimée');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Erreur lors de la suppression');
    }
    setActiveMenu(null);
  };

  const setAsHomepage = async (pageId: string) => {
    try {
      // Remove homepage status from all pages
      await supabase
        .from('pages')
        .update({ is_homepage: false })
        .eq('project_id', projectId);

      // Set new homepage
      const { error } = await supabase
        .from('pages')
        .update({ is_homepage: true })
        .eq('id', pageId);

      if (error) throw error;

      const updatedPages = pages.map(p => ({
        ...p,
        is_homepage: p.id === pageId,
      }));
      onPagesChange(updatedPages);
      toast.success('Page d\'accueil mise à jour');
    } catch (error) {
      console.error('Error setting homepage:', error);
      toast.error('Erreur lors de la mise à jour');
    }
    setActiveMenu(null);
  };

  const openEditModal = (page: Page) => {
    setEditingPage(page);
    setPageName(page.name);
    setPageSlug(page.slug);
    setShowModal(true);
    setActiveMenu(null);
  };

  return (
    <>
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Pages</h3>
          <button
            onClick={() => {
              setEditingPage(null);
              setPageName('');
              setPageSlug('');
              setShowModal(true);
            }}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                currentPage?.id === page.id
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              }`}
            >
              <button
                onClick={() => onPageSelect(page)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <FileText className="h-4 w-4" />
                <span className="truncate">{page.name}</span>
              </button>
              {page.is_homepage && (
                <Home className="h-3 w-3 text-primary" />
              )}
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === page.id ? null : page.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {activeMenu === page.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-lg shadow-lg py-1 z-20">
                    <button
                      onClick={() => openEditModal(page)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Renommer
                    </button>
                    {!page.is_homepage && (
                      <button
                        onClick={() => setAsHomepage(page.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <Home className="h-4 w-4" />
                        Définir comme accueil
                      </button>
                    )}
                    <button
                      onClick={() => deletePage(page.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Page Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-['Space_Grotesk']">
                {editingPage ? 'Modifier la page' : 'Nouvelle page'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPage(null);
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom de la page *</label>
                <input
                  type="text"
                  value={pageName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="À propos"
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug (URL)</label>
                <div className="flex items-center">
                  <span className="px-3 py-3 bg-muted rounded-l-xl border border-r-0 border-input text-muted-foreground text-sm">
                    /
                  </span>
                  <input
                    type="text"
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value)}
                    placeholder="a-propos"
                    className="flex-1 px-4 py-3 bg-background border border-input rounded-r-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPage(null);
                }}
                className="flex-1 px-4 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={editingPage ? updatePage : createPage}
                disabled={creating || !pageName.trim()}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingPage ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
