/** The site's sections, framed as stages of a data pipeline. */
export interface Stage {
  index: string;
  key: string;
  label: string;
  plain: string;
  route: string;
  blurb: string;
}

export const STAGES: Stage[] = [
  { index: '00', key: 'source', label: 'source', plain: 'Overview', route: '/', blurb: 'Who I am and where the data comes from.' },
  { index: '01', key: 'runs', label: 'runs', plain: 'Experience', route: '/runs', blurb: 'Every role as a task in one DAG run.' },
  { index: '02', key: 'artifacts', label: 'artifacts', plain: 'Projects', route: '/artifacts', blurb: 'What those runs produced.' },
  { index: '03', key: 'lineage', label: 'lineage', plain: 'Skills', route: '/lineage', blurb: 'Where each skill was actually used.' },
  { index: '04', key: 'monitor', label: 'monitor', plain: 'Impact', route: '/monitor', blurb: 'Leadership, reach and certifications.' },
  { index: '05', key: 'query', label: 'query', plain: 'Console & contact', route: '/query', blurb: 'Query everything, then send a message.' },
];
