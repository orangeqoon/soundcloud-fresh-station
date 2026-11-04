# FreshDig for SoundCloud

> 🌐 [日本語](../../README.md) | [English](README.en.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Tiếng Việt](README.vi.md) | [Română](README.ro.md)

FreshDig este o extensie Edge / Chrome care organizează stațiile SoundCloud după regulile tale de descoperire. Cu Dig ACTIVAT, omite piesele apreciate (Like), artiștii urmăriți, piesele NoPlay, artiștii salvați și artiștii blocați, apoi prioritizează piesele nevăzute și diversitatea artiștilor în coada existentă a SoundCloud.

## Problema pe care o rezolvă

În timp ce asculți o stație, piesele familiare și artiștii nedoriti pot reapărea. FreshDig nu înlocuiește recomandările SoundCloud; aplică reguli locale de excludere, de artiști salvați și, opțional, de istoric ascultat asupra candidaților și cozii pe care le oferă SoundCloud.

## Funcții principale

- **Modul Dig**: detectează și omite piese, artiști și genuri apreciate, urmărite sau excluse
- **Istoric ascultat opțional**: doar când este activat în setările Dig, înregistrează piesele care au rulat efectiv 10 secunde și le omite data viitoare (dezactivat implicit)
- **Dislike / Hate**: exclude o singură piesă sau un artist întreg
- **Lista Ascultă mai târziu**: salvează artiști și deschide pagina lor de piese din pictograma extensiei
- **Mini player**: o fereastră separată pentru redare, omitere, volum, adăugare în playlist, Like, Repost, Follow și excludere
- **Backup liste**: exportă cele patru liste (ascultă mai târziu, piese blocate, artiști blocați, genuri blocate) ca Markdown și restaurează din JSON
- **Raport de eroare**: salvează un raport de diagnostic local pentru a investiga opriri ale redării și probleme similare

## Cum înregistrează setarea „omite piesele pe care le-ai mai auzit o dată”

Această setare este dezactivată implicit. Când este activă, sunt înregistrate doar piesele a căror poziție de redare a avansat efectiv 10 secunde, după ID-ul piesei. Derularea sau pauza singure nu sunt înregistrate. Înregistrările sunt stocate în IndexedDB al paginii, cu rezervă pe localStorage dacă nu este disponibil. Când deschizi direct pagina de piese a unui artist, redarea pe acea pagină are prioritate și regulile Dig de omitere nu se aplică.

## Date și confidențialitate

Setările, listele și înregistrările FreshDig sunt stocate în browser. FreshDig nu are un server propriu de analiză și nu trimite nimic pentru publicitate. Acțiuni precum Like, Follow, Repost și adăugarea într-un playlist operează contul tău SoundCloud, deci comunică cu SoundCloud.

## Instalare

1. Deschide `edge://extensions` sau `chrome://extensions`
2. Activează modul dezvoltator
3. Apasă „Load unpacked” / „Încarcă neimpachetată” și selectează folderul extensiei

Cu Tampermonkey, poți încărca `soundcloud_fresh_station.user.js` din depozit.

## Licență

MIT License
