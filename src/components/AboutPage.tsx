import { ScriptureLink } from './ScriptureLink'

export function AboutPage() {
  return (
    <article className="page about">
      <h1>About &amp; method</h1>
      <p>
        Letter &amp; Road (also called Pauline Atlas) treats each of Paul’s letters as a message
        from a place, to a people, at a moment. Most tools map missionary journeys or list dates.
        This one starts with the letter.
      </p>

      <h2>Primary sources</h2>
      <p>
        The spine of the atlas is Scripture: the Greek New Testament as we have it in English in the
        ESV, and the Hebrew Bible where the letters themselves quote it. Every
        date-claim is asked to stand first on{' '}
        <ScriptureLink search="Acts 1:1-8">Acts</ScriptureLink>, on the letter in question, and on
        the other apostles when they speak — especially Peter on Paul in{' '}
        <ScriptureLink search="2 Peter 3:15-16">2 Peter 3:15–16</ScriptureLink>.
      </p>
      <p>
        Verse buttons open Bible Gateway in the ESV. The app does not host Bible text.
      </p>

      <h2>Secondary sources</h2>
      <p>
        Introductions, study-Bible notes, and archaeology sit in the second row. They help, they do
        not rule. The Gallio inscription from Delphi is the best extra-biblical year-marker we have
        for <ScriptureLink search="Acts 18:12-17">Acts 18</ScriptureLink>; it is still secondary to
        Luke’s narrative that Paul was in Corinth when Gallio was proconsul.
      </p>

      <h2>Consensus dates</h2>
      <p>
        The default is a narrowed evangelical Protestant consensus, reconstructed from Acts and the
        letters: Galatians early (south Galatia, from Antioch, near the{' '}
        <ScriptureLink search="Acts 15:1-11">Jerusalem council</ScriptureLink>), the Thessalonian
        letters from Corinth on the second journey, the Corinthian correspondence and Romans on the
        third, the prison cluster from Rome under house arrest (
        <ScriptureLink search="Acts 28:16,28:30-31">Acts 28:16, 30–31</ScriptureLink>), and 1
        Timothy, Titus, and 2 Timothy after Acts, with 2 Timothy as a last dispatch.
      </p>

      <h2>Wider Protestant debate</h2>
      <p>
        The other toggle does not import a different religion. It widens the years Protestants still
        argue about, and it can ghost an alternate origin city:
      </p>
      <ul>
        <li>
          <strong>South vs north Galatia.</strong> If Galatians is to the churches of{' '}
          <ScriptureLink search="Acts 13:13-14:23">Acts 13–14</ScriptureLink>, an early Antioch date
          follows. If it is ethnic Galatia farther north, the letter slides later.
        </li>
        <li>
          <strong>Which prison.</strong> Rome (Acts 28) is the consensus for Ephesians, Colossians,
          Philemon, and Philippians. Ephesus in the mid-50s, and less often Caesarea (
          <ScriptureLink search="Acts 24:27">Acts 24–26</ScriptureLink>), remain live options —
          especially where travel time for Onesimus or Epaphroditus matters.
        </li>
        <li>
          <strong>After Acts.</strong> 1 Timothy and Titus assume travel that Acts does not narrate.
          Most evangelical reconstructions assume a release after Acts 28. The wider toggle lets
          those years overlap earlier leave-takings rather than deleting the letters.
        </li>
      </ul>
      <p>Letters stay on the map. Authorship is not the fork this tool is built to fight.</p>

      <h2>Hebrews</h2>
      <p>
        Hebrews is not mapped. It is associated with the Pauline circle in church memory; the letter
        itself does not name Paul, an origin, or a destination the way these thirteen do.
      </p>

      <h2>Sources</h2>
      <ul>
        <li>Primary: Acts; the thirteen letters; 2 Peter 3:15–16; other apostolic mentions in the NT.</li>
        <li>English text linked: ESV on Bible Gateway.</li>
        <li>Secondary: evangelical NT introductions (e.g. Carson &amp; Moo); ESV Study Bible book intros.</li>
        <li>Secondary, archaeological: the Gallio inscription from Delphi, as a check on Acts 18.</li>
        <li>
          Coastlines: Natural Earth 1:50m land (public domain), clipped to the eastern Mediterranean so
          Asia, the Levant, Sinai, and Egypt remain one landmass.
        </li>
      </ul>
      <p>Not affiliated with a denomination. Built as a public teaching aid for readers, youth groups, and pastors.</p>
    </article>
  )
}
