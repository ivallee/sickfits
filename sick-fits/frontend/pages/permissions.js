import Permissions from '../components/Permissions';
import PleaseSignIn from '../components/PleaseSignIn';

const PermissionPage = props => (
  <PleaseSignIn>
    <Permissions />
  </PleaseSignIn>
);

export default PermissionPage;