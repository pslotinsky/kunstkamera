import { useStaticSearch } from 'fumadocs-core/search/client/orama-static';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
} from 'fumadocs-ui/components/dialog/search';
import type { SharedProps } from 'fumadocs-ui/contexts/search';
import { useLocation } from 'react-router';
import { getDocumentationProject } from '../../documentation/config';
import { type ProjectId, projectNames } from '../../projects';
import styles from './DocumentationSearch.module.scss';

export function DocumentationSearch(props: SharedProps) {
  const project = getDocumentationProject(useLocation().pathname);
  return project ? (
    <ProjectSearch key={project} project={project} {...props} />
  ) : null;
}

function ProjectSearch({
  project,
  ...props
}: SharedProps & { readonly project: ProjectId }) {
  const label = `Search ${projectNames[project]} documentation`;
  const search = useStaticSearch({
    from: `${import.meta.env.BASE_URL}${project}/search.json`,
  });
  return (
    <SearchDialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <p className={styles.scope}>{label}</p>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput aria-label={label} />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
      </SearchDialogContent>
    </SearchDialog>
  );
}
