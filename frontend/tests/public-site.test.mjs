import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

test("public foundation routes exist", () => {
  for (const route of ["about", "contact", "features", "privacy", "terms"]) {
    assert.equal(existsSync(join(root, "src", "app", route, "page.tsx")), true, `${route} route is missing`);
  }
});

test("shared shell keeps primary public navigation", () => {
  const source = readFileSync(join(root, "src", "components", "public-site.tsx"), "utf8");
  for (const href of ["/about", "/features", "/contact", "/explore"]) {
    assert.match(source, new RegExp(href.replace("/", "\\/")), `${href} link is missing`);
  }
  assert.match(source, /function PublicNavbar/);
  assert.match(source, /function PublicFooter/);
});

test("home page stays within the public foundation milestone", () => {
  const source = readFileSync(join(root, "src", "components", "HomePage.tsx"), "utf8");
  assert.match(source, /Find your place/);
  assert.match(source, /MapPreview/);
  assert.doesNotMatch(source, /plotora-home|mapbox-gl|hash/);
});

test("home interactions and content slots are wired", () => {
  const home = readFileSync(join(root, "src", "components", "HomePage.tsx"), "utf8");
  const data = readFileSync(join(root, "src", "data", "home-data.ts"), "utf8");
  const search = readFileSync(join(root, "src", "components", "HeroSearch.tsx"), "utf8");
  for (const text of ["Land", "Houses", "Apartments", "Projects", "Properties worth exploring", "NEW DEVELOPMENTS", "From searching to visiting"]) assert.match(home + data, new RegExp(text));
  assert.match(search, /Buy/);
  assert.match(search, /\/explore/);
  assert.match(data, /featured/);
  assert.match(home, /PropertyCard/);
});
