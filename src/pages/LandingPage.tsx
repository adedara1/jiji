import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Layers, Zap, Globe, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function LandingPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const features = [
    {
      icon: Layers,
      title: 'Drag & Drop Builder',
      description: 'Créez des interfaces visuellement avec notre éditeur intuitif. Aucun code requis.',
    },
    {
      icon: Sparkles,
      title: 'Composants Prêts',
      description: 'Bibliothèque de composants modernes et personnalisables pour vos projets.',
    },
    {
      icon: Zap,
      title: 'Preview Temps Réel',
      description: 'Visualisez vos changements instantanément pendant que vous construisez.',
    },
    {
      icon: Globe,
      title: 'Déploiement Facile',
      description: 'Publiez votre site en un clic et partagez-le avec le monde.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold font-['Space_Grotesk']">Legende Astra</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <Link
              to="/auth"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Connexion
            </Link>
            <Link
              to="/auth"
              className="px-4 py-2 text-sm font-medium bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Commencer Gratuitement
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Nouvelle génération de website builder</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-['Space_Grotesk'] leading-tight mb-6">
            Créez des sites web
            <br />
            <span className="text-gradient">sans écrire de code</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Legende Astra vous permet de concevoir et publier des sites web et applications 
            modernes en quelques minutes grâce à notre builder visuel intuitif.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-white rounded-xl font-medium text-lg shadow-glow hover:opacity-90 transition-all"
            >
              Commencer maintenant
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-8 py-4 border border-border rounded-xl font-medium text-lg hover:bg-muted transition-colors">
              Voir la démo
            </button>
          </div>
        </div>
      </section>

      {/* Preview Mockup */}
      <section className="pb-20 px-6">
        <div className="container mx-auto">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20 animate-pulse" />
            <div className="relative bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
              <div className="h-12 bg-muted flex items-center gap-2 px-4 border-b border-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="max-w-md mx-auto h-6 bg-background rounded-md flex items-center justify-center text-xs text-muted-foreground">
                    legende-astra.app/builder
                  </div>
                </div>
              </div>
              <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 animate-float">
                    <Layers className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-muted-foreground text-lg">Interface de Builder Visuel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-['Space_Grotesk'] mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-muted-foreground">
              Des outils puissants pour créer des expériences web exceptionnelles
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-card border border-border rounded-2xl hover:shadow-lg hover:border-primary/50 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-gradient-primary group-hover:text-white transition-all">
                  <feature.icon className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-12 text-center text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold font-['Space_Grotesk'] mb-4">
                Prêt à créer votre prochain projet ?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Rejoignez des milliers de créateurs qui utilisent Legende Astra pour 
                donner vie à leurs idées.
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-medium text-lg hover:bg-white/90 transition-colors"
              >
                Créer un compte gratuit
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Legende Astra</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Legende Astra. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
