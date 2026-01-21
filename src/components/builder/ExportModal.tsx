import { useState } from 'react';
import { X, Download, Code, FileJson, Globe, Loader2, Check, Copy } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

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

interface Page {
  id: string;
  name: string;
  slug: string;
  is_homepage: boolean | null;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  pages: Page[];
}

export default function ExportModal({ isOpen, onClose, projectId, projectName, pages }: ExportModalProps) {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<'html' | 'json' | 'react'>('html');
  const [exportedCode, setExportedCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateHtml = (components: Component[], page: Page): string => {
    const renderComponent = (comp: Component): string => {
      const props = comp.props as Record<string, string>;
      
      switch (comp.component_type) {
        case 'hero':
          return `
    <section class="hero">
      <h1>${props.title || 'Titre'}</h1>
      <p>${props.subtitle || 'Sous-titre'}</p>
      <button class="btn-primary">${props.cta || 'Action'}</button>
    </section>`;
        
        case 'navbar':
          return `
    <nav class="navbar">
      <span class="logo">${props.logo || 'Logo'}</span>
      <div class="nav-links">
        <a href="#">Lien 1</a>
        <a href="#">Lien 2</a>
        <a href="#">Lien 3</a>
      </div>
    </nav>`;
        
        case 'text':
          return `
    <p>${props.content || 'Texte'}</p>`;
        
        case 'button':
          return `
    <button class="btn-primary">${props.label || 'Bouton'}</button>`;
        
        case 'card':
          return `
    <div class="card">
      <h3>${props.title || 'Titre'}</h3>
      <p>${props.description || 'Description'}</p>
    </div>`;
        
        case 'footer':
          return `
    <footer>
      <p>${props.copyright || '© 2024'}</p>
    </footer>`;
        
        case 'section':
          return `
    <section class="section">
      <!-- Section content -->
    </section>`;
        
        default:
          return `
    <!-- ${comp.component_type} -->`;
      }
    };

    const componentsHtml = components.map(renderComponent).join('\n');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.name} - ${projectName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; line-height: 1.6; }
    .hero { min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
    .hero p { font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9; }
    .btn-primary { padding: 0.75rem 1.5rem; background: white; color: #667eea; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; }
    .navbar { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; background: #fff; border-bottom: 1px solid #eee; }
    .logo { font-weight: bold; font-size: 1.25rem; }
    .nav-links { display: flex; gap: 1.5rem; }
    .nav-links a { text-decoration: none; color: #666; }
    .card { padding: 1.5rem; border: 1px solid #eee; border-radius: 0.75rem; margin: 1rem; }
    .card h3 { margin-bottom: 0.5rem; }
    .section { padding: 4rem 2rem; }
    footer { padding: 2rem; text-align: center; background: #f5f5f5; }
  </style>
</head>
<body>
${componentsHtml}
</body>
</html>`;
  };

  const generateReactCode = (components: Component[], page: Page): string => {
    const renderComponent = (comp: Component): string => {
      const props = comp.props as Record<string, string>;
      
      switch (comp.component_type) {
        case 'hero':
          return `      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
        <h1 className="text-5xl font-bold mb-4">${props.title || 'Titre'}</h1>
        <p className="text-xl mb-8 opacity-90">${props.subtitle || 'Sous-titre'}</p>
        <button className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold">${props.cta || 'Action'}</button>
      </section>`;
        
        case 'navbar':
          return `      <nav className="flex items-center justify-between p-4 bg-white border-b">
        <span className="font-bold text-xl">${props.logo || 'Logo'}</span>
        <div className="flex gap-6">
          <a href="#" className="text-gray-600 hover:text-gray-900">Lien 1</a>
          <a href="#" className="text-gray-600 hover:text-gray-900">Lien 2</a>
          <a href="#" className="text-gray-600 hover:text-gray-900">Lien 3</a>
        </div>
      </nav>`;
        
        case 'text':
          return `      <p className="p-4">${props.content || 'Texte'}</p>`;
        
        case 'button':
          return `      <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">
        ${props.label || 'Bouton'}
      </button>`;
        
        case 'card':
          return `      <div className="p-6 border rounded-xl m-4">
        <h3 className="text-lg font-semibold mb-2">${props.title || 'Titre'}</h3>
        <p className="text-gray-600">${props.description || 'Description'}</p>
      </div>`;
        
        case 'footer':
          return `      <footer className="p-8 bg-gray-100 text-center">
        <p className="text-gray-600">${props.copyright || '© 2024'}</p>
      </footer>`;
        
        default:
          return `      {/* ${comp.component_type} */}`;
      }
    };

    const componentsCode = components.map(renderComponent).join('\n\n');

    return `import React from 'react';

export default function ${page.name.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <div className="min-h-screen">
${componentsCode}
    </div>
  );
}`;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all components for all pages
      const allComponents: Record<string, Component[]> = {};
      
      for (const page of pages) {
        const { data, error } = await supabase
          .from('components')
          .select('*')
          .eq('page_id', page.id)
          .order('order_index');
        
        if (error) throw error;
        allComponents[page.id] = (data || []) as Component[];
      }

      let exportContent = '';
      
      if (exportType === 'json') {
        exportContent = JSON.stringify({
          project: projectName,
          pages: pages.map(page => ({
            ...page,
            components: allComponents[page.id] || [],
          })),
        }, null, 2);
      } else if (exportType === 'html') {
        // Export first page as HTML
        const homepage = pages.find(p => p.is_homepage) || pages[0];
        if (homepage) {
          exportContent = generateHtml(allComponents[homepage.id] || [], homepage);
        }
      } else if (exportType === 'react') {
        const homepage = pages.find(p => p.is_homepage) || pages[0];
        if (homepage) {
          exportContent = generateReactCode(allComponents[homepage.id] || [], homepage);
        }
      }

      setExportedCode(exportContent);
      toast.success('Export généré avec succès');
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = () => {
    const extensions: Record<string, string> = {
      html: 'html',
      json: 'json',
      react: 'tsx',
    };
    
    const blob = new Blob([exportedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.${extensions[exportType]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Fichier téléchargé');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copié dans le presse-papier');
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold font-['Space_Grotesk']">Exporter le projet</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Format d'export</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setExportType('html')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  exportType === 'html'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Globe className="h-6 w-6" />
                <span className="font-medium">HTML</span>
                <span className="text-xs text-muted-foreground">Site statique</span>
              </button>
              <button
                onClick={() => setExportType('react')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  exportType === 'react'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Code className="h-6 w-6" />
                <span className="font-medium">React</span>
                <span className="text-xs text-muted-foreground">Composants JSX</span>
              </button>
              <button
                onClick={() => setExportType('json')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  exportType === 'json'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FileJson className="h-6 w-6" />
                <span className="font-medium">JSON</span>
                <span className="text-xs text-muted-foreground">Données brutes</span>
              </button>
            </div>
          </div>

          {/* Generate Button */}
          {!exportedCode && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Générer l'export
                </>
              )}
            </button>
          )}

          {/* Code Preview */}
          {exportedCode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Code généré</span>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                  <button
                    onClick={downloadFile}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-muted rounded-xl overflow-x-auto text-sm max-h-80">
                <code>{exportedCode}</code>
              </pre>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
