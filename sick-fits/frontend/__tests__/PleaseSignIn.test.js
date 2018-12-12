import { mount } from 'enzyme';
import wait from 'waait';
import PleaseSignIn from '../components/PleaseSignIn';
import { CURRENT_USER_QUERY } from '../components/User';
import { MockedProvider } from 'react-apollo/test-utils';
import { fakeUser } from '../lib/testUtils';

const notSignedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: null } },
  }
];

const signedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: fakeUser() } },
  }
];

describe('<PleaseSignIn/>', () => {
  it('renders the signin dialog if not logged in', async () => {
    const wrapper = mount(
      <MockedProvider mocks={notSignedInMocks}>
        <PleaseSignIn />
      </MockedProvider>
    );
    expect(wrapper.text()).toContain('Loading...');
    await wait();
    wrapper.update();
    expect(wrapper.text()).toContain('Sign into your account')
    expect(wrapper.find('Signin').exists()).toBe(true)
  });

  it('renders the child component if logged in', async () => {
    const TestChild = () => <p>Test child</p>
    const wrapper = mount(
      <MockedProvider mocks={signedInMocks}>
        <PleaseSignIn>
          <TestChild />
        </PleaseSignIn>
      </MockedProvider>
    );

    await wait();
    wrapper.update();
    
    expect(wrapper.contains(<TestChild />)).toBe(true);

  });
});