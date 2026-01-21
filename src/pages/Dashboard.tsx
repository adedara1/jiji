import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../integrations/supabase/client';
import {
  Plus,
  Folder,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
  Search,
  Sparkles,
  LogOut,
  Settings,
  Moon,
  Sun,
  Loader2,
  LayoutGrid,
  List,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const { user, profile, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Veuillez entrer un nom pour le projet');
      return;
    }
    if (!user?.id) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName,
          description: newProjectDescription || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create default homepage
      await supabase.from('pages').insert({
        project_id: data.id,
        name: 'Accueil',
        slug: 'home',
        is_homepage: true,
      });

      toast.success('Projet créé avec succès !');
      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
      navigate(`/builder/${data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Erreur lors de la création du projet');
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;

      setProjects(projects.filter((p) => p.id !== projectId));
      toast.success('Projet supprimé');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Erreur lors de la suppression');
    }
    setActiveMenu(null);
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-500';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'archived':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publié';
      case 'draft':
        return 'Brouillon';
      case 'archived':
        return 'Archivé';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold font-['Space_Grotesk']">Legende Astra</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Settings className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-medium">
                {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{profile?.display_name || 'Utilisateur'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Page Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-['Space_Grotesk']">Mes Projets</h1>
            <p className="text-muted-foreground">Gérez et créez vos sites web et applications</p>
          </div>

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-5 w-5" />
            Nouveau Projet
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un projet..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Projects Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Folder className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? 'Aucun projet trouvé' : 'Aucun projet pour le moment'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Essayez une autre recherche'
                : 'Créez votre premier projet pour commencer'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="h-5 w-5" />
                Créer un projet
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  {project.thumbnail_url ? (
                    <img
                      src={project.thumbnail_url}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Folder className="h-12 w-12 text-muted-foreground/50" />
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{project.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {project.description || 'Pas de description'}
                      </p>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {activeMenu === project.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-lg shadow-lg py-1 z-10">
                          <Link
                            to={`/builder/${project.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            Éditer
                          </Link>
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                            <ExternalLink className="h-4 w-4" />
                            Prévisualiser
                          </button>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getStatusColor(project.status)}`}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(project.updated_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Hover Overlay */}
                <Link
                  to={`/builder/${project.id}`}
                  className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <span className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm">
                    Ouvrir l'éditeur
                  </span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md hover:border-primary/50 transition-all"
              >
                <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center flex-shrink-0">
                  {project.thumbnail_url ? (
                    <img
                      src={project.thumbnail_url}
                      alt={project.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Folder className="h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {project.description || 'Pas de description'}
                  </p>
                </div>

                <span
                  className={`hidden md:inline-flex px-2 py-1 text-xs font-medium rounded-md ${getStatusColor(project.status)}`}
                >
                  {getStatusLabel(project.status)}
                </span>

                <span className="hidden md:block text-sm text-muted-foreground">
                  {new Date(project.updated_at).toLocaleDateString('fr-FR')}
                </span>

                <Link
                  to={`/builder/${project.id}`}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  Éditer
                </Link>

                <button
                  onClick={() => deleteProject(project.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold font-['Space_Grotesk'] mb-4">Nouveau Projet</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom du projet *</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Mon super site"
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Décrivez votre projet..."
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="flex-1 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={createProject}
                disabled={creating || !newProjectName.trim()}
                className="flex-1 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="h-5 w-5 animate-spin" />}
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menus */}
      {activeMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setActiveMenu(null)} />
      )}
    </div>
  );
}
