import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { Outlet } from 'react-router';
import { layoutOptions } from '../../layoutOptions';
import { HomeHeader } from './HomeHeader';

export default function Site() {
  return (
    <HomeLayout
      {...layoutOptions}
      searchToggle={{ enabled: false }}
      slots={{ header: HomeHeader }}
    >
      <Outlet />
    </HomeLayout>
  );
}
