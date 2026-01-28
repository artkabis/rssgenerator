# Données de démonstration RSS Generator

Ce dossier contient les données de test pour valider le fonctionnement de l'application.

## Structure

```
demo/
├── data/
│   ├── posts.json    # 5 posts de démonstration
│   └── config.json   # Configuration du flux
├── rss/
│   └── feed.xml      # Flux RSS pré-généré
└── README.md
```

## Utilisation

### Mode démo local

Pour utiliser les données de démo en local :

```bash
# Copier les données vers le serveur
cp -r demo/data/* server/data/
cp -r demo/rss/* server/rss/

# Démarrer l'application
npm run dev
```

### GitHub Pages

La GitHub Action `ci.yml` déploie automatiquement une version statique sur GitHub Pages avec les données de démo.

## Données de test

### Posts inclus

1. **Bienvenue sur RSS Generator** - Introduction à l'application
2. **Meilleures pratiques RSS** - Conseils d'optimisation
3. **Nouveautés v1.0** - Changelog des fonctionnalités
4. **Guide d'intégration** - Tutoriel technique
5. **Webinaire** - Exemple d'événement

### Médias

Toutes les images utilisent des ressources **Unsplash** (licence libre) :
- Vignettes : 800x600px
- Médias additionnels : 600x400px

## Validation

Le flux RSS est validé par :
- `xmllint` pour la syntaxe XML
- Vérification des éléments RSS requis
- Test de lecture par le serveur
