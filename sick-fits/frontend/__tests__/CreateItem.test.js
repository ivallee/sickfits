import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import Router from 'next/router';
import { MockedProvider } from 'react-apollo/test-utils';
import CreateItem, { CREATE_ITEM_MUTATION } from '../components/CreateItem';
import { fakeItem } from '../lib/testUtils';

const testImage = 'https://example.com/testimage.jpg';

global.fetch = jest.fn().mockResolvedValue({
  json: () => ({
    secure_url: testImage,
    eager: [{ secure_url: testImage }],
  }),
});

describe('<CreateItem/>', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    await wait();
    wrapper.update();

    const form = wrapper.find('form[data-test="form"]');
    expect(toJSON(form)).toMatchSnapshot();
  });

  it('uploads a file when changed', async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const input = wrapper.find('input[type="file"]');
    input.simulate('change', { target: { files: ['testimage.jpg'] } });
    await wait();
    const component = wrapper.find('CreateItem').instance();
    expect(component.state.image).toEqual(testImage);
    expect(component.state.largeImage).toEqual(testImage);
    global.fetch.mockReset();
  });

  it('handles state updates', () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );

    wrapper
      .find('#title')
      .simulate('change', { target: { value: 'Testing', name: 'title' } });
    wrapper
      .find('#price')
      .simulate('change', { target: { value: 5400, name: 'price', type: 'number' } });
    wrapper
      .find('#description')
      .simulate('change', { target: { value: 'this is a description of an item', name: 'description' } });

    expect(wrapper.find('CreateItem').instance().state).toMatchObject({
      title: 'Testing',
      price: 5400,
      description: 'this is a description of an item'
    });
  });

  it('creates an item when form is submitted', async () => {
    const item = fakeItem();
    const mocks = [{
      request: {
        query: CREATE_ITEM_MUTATION,
        variables: {
          title: item.title,
          description: item.description,
          price: item.price,
          image: '',
          largeImage: '',
        },
      },
      result: {
        data: {
          createItem: {
            ...item,
            __typename: 'Item',
          }
        }
      }
    }];

    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <CreateItem />
      </MockedProvider>
    );

    wrapper
      .find('#title')
      .simulate('change', { target: { value: item.title, name: 'title' } });
    wrapper
      .find('#price')
      .simulate('change', { target: { value: item.price, name: 'price', type: 'number' } });
    wrapper
      .find('#description')
      .simulate('change', { target: { value: item.description, name: 'description' } });
    
    Router.router = { push: jest.fn() };
    wrapper.find('form').simulate('submit');
    await wait(50);
    expect(Router.router.push).toHaveBeenCalled(); 
    expect(Router.router.push).toHaveBeenCalledWith({
      pathname: '/item',
      query: {
        id: 'abc123',
      }
    }); 
  });
});