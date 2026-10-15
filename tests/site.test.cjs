const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
function findPages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'tests') return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? findPages(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
const pages = findPages(root)
  .map(file => ({ file, html: fs.readFileSync(file, 'utf8') }))
  .filter(({ html }) => html.includes('class="site-shell"'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const links = html => [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
function assertLocalTarget(file, href) {
  if (/^(https?:|mailto:|\/\/)/.test(href)) return;
  const [pathname, fragment] = href.split('#');
  const target = pathname ? path.resolve(path.dirname(file), pathname) : file;
  assert.ok(fs.existsSync(target), `${path.relative(root, file)} -> ${href}`);
  if (fragment) {
    const html = fs.readFileSync(target, 'utf8');
    assert.ok(html.includes(`id="${fragment}"`), `Missing anchor: ${href}`);
  }
}

test('all template pages have responsive metadata and accessible landmarks', () => {
  assert.ok(pages.length >= 57);
  for (const { file, html } of pages) {
    const label = path.relative(root, file);
    assert.match(html, /^<!DOCTYPE html>/, label);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1"/, label);
    assert.match(html, /<html lang="(pt-BR|en)">/, label);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, label);
    assert.equal((html.match(/<main\b/g) || []).length, 1, label);
    assert.match(html, /<main[^>]*id="main-content"[^>]*tabindex="-1"/, label);
    assert.match(html, /class="skip-link" href="#main-content"/, label);
    assert.match(html, /<header class="site-header">/, label);
    assert.doesNotMatch(html, /brand-subtitle/, label);
    assert.match(html, /<footer class="site-footer">/, label);
    assert.match(html, /<details class="mobile-nav"><summary>[^<]+<\/summary>/, label);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size, `Duplicate IDs: ${label}`);
    for (const match of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
      for (const id of match[1].split(' ')) assert.ok(ids.includes(id), `${label}: ${id}`);
    }
  }
});

test('shared navigation, translations, breadcrumbs and stylesheet resolve at every depth', () => {
  for (const { file, html } of pages) {
    const blocks = [
      ...html.matchAll(/<nav\b[^>]*class="(?:desktop-nav|language-switch|breadcrumbs|footer-links)"[^>]*>([\s\S]*?)<\/nav>/g),
      ...html.matchAll(/<details class="mobile-nav">([\s\S]*?)<\/details>/g)
    ];
    for (const block of blocks) {
      for (const href of links(block[1])) assertLocalTarget(file, href);
    }
    const css = /<link rel="stylesheet" href="([^"]+)"/.exec(html);
    assert.ok(css, file);
    assertLocalTarget(file, css[1]);
    const isEnglish = path.relative(root, file).startsWith(`en${path.sep}`);
    assert.ok(html.includes(`<html lang="${isEnglish ? 'en' : 'pt-BR'}">`), file);
    for (const match of html.matchAll(/<a href="([^"]+)" lang="([^"]+)" hreflang="[^"]+">/g)) {
      const translated = fs.readFileSync(path.resolve(path.dirname(file), match[1]), 'utf8');
      assert.ok(translated.includes(`<html lang="${match[2]}">`), file);
      const returnPath = path.relative(path.dirname(path.resolve(path.dirname(file), match[1])), file).split(path.sep).join('/');
      assert.ok(translated.includes(`href="${returnPath}"`), `No return translation: ${file}`);
    }
  }
});

test('home, research and teaching cards preserve working local entry points in both languages', () => {
  for (const prefix of ['', 'en/']) {
    for (const name of ['index.html', 'projetos.html', 'materiais.html', 'contatos.html']) {
      const html = read(prefix + name);
      const main = /<main\b[^>]*>([\s\S]*?)<\/main>/.exec(html)[1];
      for (const href of links(main)) assertLocalTarget(path.join(root, prefix + name), href);
    }
    const home = read(prefix + 'index.html');
    assert.equal((home.match(/class="publication"/g) || []).length, 3);
    assert.match(home, /<img[^>]*alt="[^"]+"[^>]*fetchpriority="high"/);
    assert.match(home, /id="about-title"/);
  }
});

test('publication archives retain all 52 entries and working year navigation', () => {
  for (const prefix of ['', 'en/']) {
    const file = path.join(root, prefix, 'publicacoes.html');
    const html = fs.readFileSync(file, 'utf8');
    assert.ok((html.match(/class="publication"/g) || []).length >= 52);
    const years = [...html.matchAll(/class="publication-year" id="year-(\d{4})"/g)].map(match => Number(match[1]));
    assert.ok(years.length >= 20);
    assert.deepEqual(years, [...years].sort((a, b) => b - a));
    const nav = /<nav class="year-nav"[^>]*>([\s\S]*?)<\/nav>/.exec(html)[1];
    assert.deepEqual(links(nav), years.map(year => `#year-${year}`));
    for (const href of links(nav)) assertLocalTarget(file, href);
    for (const href of links(html).filter(href => /(?:^|\/)docs\//.test(href))) {
      assertLocalTarget(file, href);
    }
  }
});

test('site presentation has no runtime framework or script dependency', () => {
  for (const { file, html } of pages) {
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    for (const [, attributes, body] of scripts) {
      assert.ok(
        attributes.includes('googletagmanager.com') ||
        body.includes("gtag('config'") ||
        body.includes("ga('create'"),
        `Unexpected runtime script in ${file}`
      );
    }
  }
});

test('specified publication titles use the same heading markup in both languages', () => {
  const titles = [
    'O Impacto da Era Digital na Saúde Mental',
    'Formando engenheiros para a sociedade 5.0: comunidades de aprendizagem, diversidade e metodologias ativas no currículo integrado com o capstone',
    'DSSE: An environment for simulation of reinforcement learning-empowered drone swarm maritime search and rescue missions',
    'DSSE: a drone swarm search environment',
    'Manual do CPS',
    'Biblioteca de Componentes Reusáveis para Ambientes de Ensino Virtual'
  ];
  for (const prefix of ['', 'en/']) {
    const html = read(prefix + 'publicacoes.html');
    const headings = [...html.matchAll(/<h3>([\s\S]*?)<\/h3>/g)]
      .map(match => match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
    for (const title of titles) {
      assert.equal(headings.filter(heading => heading === title).length, 1, `${prefix}: ${title}`);
    }
    assert.match(html, /<h3><a href="\.\/docs\/mor2025\.pdf">O Impacto da Era Digital na Saúde Mental<\/a><\/h3>/);
  }
});
