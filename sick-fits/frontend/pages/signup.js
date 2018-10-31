import Signup from '../components/Signup';
import styled from 'styled-components';

const Column = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 20px;
`;

const SignupPage = props => (
  <Column>
      <Signup />
      <Signup />
      <Signup />
  </Column>
);

export default SignupPage;