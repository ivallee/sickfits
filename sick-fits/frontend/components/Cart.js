import React from 'react';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { adopt } from 'react-adopt';
import User from './User';
import CartItem from './CartItem';
import CartStyles from './styles/CartStyles';
import Supreme from './styles/Supreme';
import CloseButton from './styles/CloseButton';
import SickButton from './styles/SickButton';
import calcTotalPrice from '../lib/calcTotalPrice';
import formatMoney from '../lib/formatMoney';
import TakeMyMoney from './TakeMyMoney';

const LOCAL_STATE_QUERY = gql`
  query {
    cartOpen @client
  }
`;

const TOGGLE_CART_MUTATION = gql`
  mutation {
    toggleCart @client
  }
`;

const Compose = adopt({
  user: ({ render }) => <User>{render}</User>,
  toggleCart: ({ render }) => <Mutation mutation={TOGGLE_CART_MUTATION}>{render}</Mutation>,
  localState: ({ render }) => <Query query={LOCAL_STATE_QUERY}>{render}</Query>
});

const Cart = () => {
  return (
    <Compose>
      {({user, toggleCart, localState }) => {
        const { me } = user.data;
        if (!me) return null;
        return (
          <CartStyles open={localState.data.cartOpen}>
            <header>
              <CloseButton onClick={toggleCart} title="close">&times;</CloseButton>
              <Supreme>{me.name}'s Cart</Supreme>
              <p>You have {me.cart.length} item{me.cart.length === 1 ? '' : 's'} in your cart</p>
            </header>
            <ul>
              {me.cart.map(cartItem => {
                return <CartItem key={cartItem.id} cartItem={cartItem} />
              })}
            </ul>
            <footer>
              {me.cart.length && 
                <>
                  <p>{formatMoney(calcTotalPrice(me.cart))}</p>
                  <TakeMyMoney>
                    <SickButton>Checkout</SickButton>
                  </TakeMyMoney>
                </>
              }
            </footer>
          </CartStyles>
        );
      }}
    </Compose>
  );
};

export default Cart;
export { LOCAL_STATE_QUERY, TOGGLE_CART_MUTATION };