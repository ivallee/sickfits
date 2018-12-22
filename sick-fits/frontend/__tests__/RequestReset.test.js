import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import { MockedProvider } from 'react-apollo/test-utils';
import RequestReset, { REQUEST_RESET_MUTATION } from '../components/RequestReset';

const mocks = [
  {
    request: { 
      query: REQUEST_RESET_MUTATION,
      variables: { 
        email: 'isaacvallee@gmail.com' 
      }, 
    },
    result: {
      data: {
        requestReset: { __typename: 'Message', message: 'success!' },
      },
    },
  },
];

describe('<RequestReset/>', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider>
        <RequestReset />
      </MockedProvider>
    );
    await wait();
    wrapper.update();

    const form = wrapper.find('form[data-test="form"]');
    expect(toJSON(form)).toMatchSnapshot();
  });

  it('calls the mutation', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <RequestReset />
      </MockedProvider>
    );
  
    wrapper
      .find('input')
      .simulate('change', { target: { name: 'email', value: 'isaacvallee@gmail.com' } });

    wrapper.find('form').simulate('submit');
    await wait();
    wrapper.update();
    expect(wrapper.find('p').text()).toContain('Reset Token Sent. Check your email!');

  });
});