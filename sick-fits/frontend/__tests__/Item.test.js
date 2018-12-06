import Item from '../components/Item';
import { shallow } from 'enzyme';

const fakeItem = {
  id: 'abc123',
  title: 'a dope item',
  price: 5400,
  description: 'this is an item that exists',
  image: 'item.jpg',
  largeImage: 'largeItem.jpg',
};

describe('<Item/>', () => {
  it('renders the image', () => {
    const wrapper = shallow(<Item item={fakeItem} />);
    const img = wrapper.find('img');
    expect(img.props().src).toBe(fakeItem.image);
    expect(img.props().alt).toBe(fakeItem.title);
  });

  it('renders price, title and description', () => {
    const wrapper = shallow(<Item item={fakeItem} />);
    const PriceTag = wrapper.find('PriceTag');
    expect(PriceTag.children().text()).toBe('$54');
    expect(wrapper.find('Title a').text()).toBe(fakeItem.title);
    expect(wrapper.find('p').text()).toBe(fakeItem.description);
  });

  it('renders the buttons', () => {
    const wrapper = shallow(<Item item={fakeItem} />);
    const buttonList = wrapper.find('.buttonList');
    expect(buttonList.children()).toHaveLength(3);
    expect(buttonList.find('Link').exists()).toBe(true);
    expect(buttonList.find('DeleteItem').exists()).toBe(true);
  });

});