function H3({ children }: { children: string }) {
  return <h3 className="cv-project-name">{children}</h3>
}

function SubHead({ children }: { children: string }) {
  return <p className="cv-sub-head">{children}</p>
}

function Lines({ items }: { items: string[] }) {
  return (
    <ul className="cv-list">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

export default function CVPage() {
  return (
    <>
      <h1 className="project-title">CV / Selected Works</h1>

      <h2 className="section-title" style={{ marginTop: '48px' }}>Selected Projects &amp; Exhibitions</h2>
      <p style={{ fontSize: '14px', color: '#555', marginBottom: '24px', lineHeight: 1.7 }}>
        A selection of solo projects, installations and presentations, followed by group exhibitions, special projects and publications.
      </p>

      <div className="cv-projects-grid">
        {/* ── LEFT COLUMN ── */}
        <div>
          <H3>• Innate Curiosity</H3>
          <SubHead>Art fairs</SubHead>
          <Lines items={['2026 — NAP+, Amsterdam, NL']} />

          <H3>• The Zine Project</H3>
          <SubHead>Solo presentations</SubHead>
          <Lines items={[
            '2026 — Studio presentation (ongoing), by appointment, Amsterdam, NL',
            '2025 — Torch Gallery, Amsterdam, NL',
            '2023 — Josilda da Conceição Gallery, Amsterdam, NL',
          ]} />

          <H3>• TenFifteen — The Social Landscape</H3>
          <SubHead>Permanent installations</SubHead>
          <Lines items={[
            'Leica Store, Lisse, NL (since 2026)',
            'Strayfield Gallery, Hellerup, DK (since 2020)',
            'TORCH Gallery, Amsterdam, NL (since 2018)',
            'Hotel Not Hotel, Amsterdam, NL (since 2018)',
          ]} />
          <SubHead>Exhibited installations</SubHead>
          <Lines items={[
            '2026 — Torch Gallery, Amsterdam, NL',
            '2025 — Torch Gallery, Amsterdam, NL',
            '2019 — Former ABN AMRO, Amsterdam, NL',
            '2018 — Arti et Amicitiae, Amsterdam, NL',
            '2018 — Torch Gallery, Amsterdam, NL',
            '2018 — ODAM at Georgies, Amsterdam, NL',
            '2018 — Amsterdam Central Station, Amsterdam, NL',
            '2017 — Josilda da Conceição Gallery, Amsterdam, NL',
            '2016 — Bright Side Gallery, Amsterdam, NL',
            '2015 — Walls Gallery, Amsterdam, NL',
            '2014 — Majke Hüsstege, Den Bosch, NL',
          ]} />
          <SubHead>Installations at Art fairs (selection)</SubHead>
          <Lines items={[
            '2017 — 6voor6 Art Fair, Amsterdam, NL',
            '2014 — The Great Last Minute Art Fair, Rotterdam, NL',
          ]} />
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          <H3>• The Social Media Project</H3>
          <SubHead>Solo presentations</SubHead>
          <Lines items={[
            '2022 — Torch Gallery, Amsterdam, NL',
            '2020 — Strayfield Gallery, Copenhagen, DK',
            '2018 — Torch Gallery, Amsterdam, NL',
            '2018 — Amsterdam Central Station, Amsterdam, NL',
            '2016 — 30Works Gallery, Cologne, DE',
            '2015 — Walls Gallery, Amsterdam, NL → video',
            '2014 — Majke Hüsstege, Den Bosch, NL',
            '2012 — Walls Gallery, Amsterdam, NL',
          ]} />
          <SubHead>Art fairs (selection)</SubHead>
          <Lines items={[
            '2024 — NAP+, Amsterdam, NL',
            '2022 — Unseen Amsterdam, NL',
            '2017 — 6voor6 Art Fair, Amsterdam, NL',
            '2016 — This Art Fair, Amsterdam, NL',
            '2015 — This Art Fair, Amsterdam, NL',
            '2015 — KunstRAI, Amsterdam, NL',
            '2014 — PAN Amsterdam, NL',
          ]} />
          <SubHead>Group exhibitions (selection)</SubHead>
          <Lines items={[
            '2024 — 40Y Torch Gallery, Amsterdam, NL',
            '2022 — Luxfer & Lípa, Česká Skalice, CZ',
            '2022 — Caesuur & Lípa, Middelburg, NL',
            '2020 — Strayfield Gallery, Hellerup, DK',
            '2018 — Arti et Amicitiae, Amsterdam, NL',
            '2017 — Josilda da Conceição Gallery, Amsterdam, NL',
            '2016 — Bright Side Gallery, Amsterdam, NL',
            '2015 — Schau Fenster Gallery, Berlin, DE',
            '2015 — FB69 Gallery, Münster, DE',
            '2014 — Walls Gallery, Amsterdam, NL',
            '2013 — Flaxon Ptootch, London, UK',
          ]} />
          <SubHead>Special projects (selection)</SubHead>
          <Lines items={[
            '2018 — ODAM, Amsterdam, NL',
            '2016 — OFFF by Night, Antwerp, BE',
            '2013 — Nuit Blanche, Amsterdam, NL',
            '2013 — FOAM, Amsterdam, NL',
          ]} />
        </div>
      </div>

      {/* ── Publications ── */}
      <h2 className="section-title" style={{ marginTop: '64px' }}>Publications, Press &amp; Media</h2>

      <SubHead>Self-published books</SubHead>
      <p className="cv-sub-label">The Zine Project (2021–2025)</p>
      <Lines items={[
        'Zine Nº10 — TenFifteen',
        'Zine Nº9 — A.S.I.A.',
        'Zine Nº8 — The Warsaw SAGA',
        'Zine Nº7 — 12.5Y Sander Dekker',
        'Zine Nº6 — Claudia',
        'Zine Nº5 — Mexico',
        'Zine Nº4 — Cats & Dogs',
        'Zine Nº3 — Janna',
        'Zine Nº2 — Girls in Paris',
        'Zine Nº1 — Annemarijn',
        'ISBN 9789082111347',
      ]} />
      <p className="cv-sub-label" style={{ marginTop: '12px' }}>My Name Is Sander Dekker</p>
      <Lines items={[
        'Volume 2 — ISBN 9789082111330',
        'Volume 1.5 — ISBN 9789082111323',
        'Volume 1 — ISBN 9789082111316',
      ]} />

      <div style={{ marginTop: '24px' }}>
        <SubHead>Press, publications &amp; media (selection)</SubHead>
      </div>
      <p className="cv-sub-label">National newspapers (NL)</p>
      <Lines items={[
        'Het Parool (29-06-2018, 15-06-2018, 17-12-2016, 05-12-2014)',
        'De Volkskrant (30-11-2019, 07-11-2015)',
      ]} />
      <p className="cv-sub-label" style={{ marginTop: '12px' }}>Magazines &amp; cultural platforms</p>
      <div className="cv-press">
        {['BLINK Korea','CODE Magazine','Juxtapoz','Le Petit Voyeur','Lodown Magazine','Purple France','Snoecks','VICE Creators','VICE Magazine'].map(item => (
          <span key={item} className="cv-press-item">{item}</span>
        ))}
      </div>
      <p className="cv-sub-label" style={{ marginTop: '16px' }}>Art platforms &amp; indexes</p>
      <Lines items={['Gallery Viewer (2023, 2025)']} />
      <p className="cv-sub-label" style={{ marginTop: '12px' }}>Video &amp; broadcast</p>
      <Lines items={['ABC Video']} />
    </>
  )
}
