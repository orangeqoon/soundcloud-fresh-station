# FreshDig for SoundCloud

> 🌐 [日本語](../../README.md) | [English](README.en.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Tiếng Việt](README.vi.md)

FreshDig ist eine Chrome- und Edge-Erweiterung für Hörer, DJs und Produzenten, die mit SoundCloud-Stationen neue Künstler entdecken. Dig wendet eigene Regeln auf die von SoundCloud gelieferten Kandidaten und die Warteschlange an.

## Welches Problem es löst

Beim Hören einer Station tauchen immer wieder bekannte Titel oder Künstler auf, die du vermeiden möchtest. FreshDig wählt den nächsten Titel anhand der Titelinformationen von SoundCloud und der lokalen FreshDig-Einstellungen.

## Hauptfunktionen

- **Dig-Modus**: erkennt und überspringt gelikte, gefolgte und ausgeschlossene Titel, Künstler und Genres
- **Einmal gehörte Titel überspringen**: nur wenn in den Dig-Einstellungen aktiviert; Titel, die tatsächlich 10 Sekunden liefen, werden gespeichert und beim nächsten Mal übersprungen (standardmäßig aus)
- **Dislike / Hate**: einen einzelnen Titel oder einen ganzen Künstler ausschließen
- **Später-hören-Liste**: Künstler speichern und ihre Titelseite über das Erweiterungssymbol öffnen
- **Mini-Player**: eigenes Fenster für Wiedergabe, Weiter, Lautstärke, Playlist hinzufügen, Like, Repost, Follow und Ausschließen
- **Listen-Backup**: die vier Listen (später hören, gesperrte Titel, gesperrte Künstler, gesperrte Genres) als Markdown exportieren und aus JSON wiederherstellen
- **Fehlerbericht**: einen lokalen Diagnosebericht speichern, um z. B. Wiedergabestopps zu untersuchen

## Wie „einmal gehörte Titel überspringen" aufzeichnet

Diese Einstellung ist standardmäßig aus. Wenn sie aktiv ist, werden nur Titel, deren Wiedergabeposition tatsächlich 10 Sekunden vorangeschritten ist, per Titel-ID gespeichert. Spulen oder Pausieren allein wird nicht gespeichert. Die Daten liegen in der IndexedDB der Seite, mit localStorage als Ausweichlösung. Wenn du die Titelseite eines Künstlers direkt öffnest, hat die Wiedergabe dort Vorrang und die Dig-Regeln werden nicht angewendet.

## Daten und Datenschutz

Einstellungen, Listen und Hörverlauf von FreshDig werden in deinem Browser gespeichert. FreshDig betreibt keinen eigenen Analyseserver und sendet nichts zu Werbezwecken. Aktionen wie Like, Follow, Repost und Playlist hinzufügen bedienen dein SoundCloud-Konto und kommunizieren daher mit SoundCloud.

## Installation

1. `edge://extensions` oder `chrome://extensions` öffnen
2. Entwicklermodus aktivieren
3. „Entpackte Erweiterung laden" wählen und den Erweiterungsordner auswählen

Mit Tampermonkey kannst du `soundcloud_fresh_station.user.js` aus dem Repository laden.

## Lizenz

MIT License
