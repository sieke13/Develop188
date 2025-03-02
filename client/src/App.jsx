import './App.css';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
// Create the http link to the GraphQL server
const httpLink = createHttpLink({
    uri: '/graphql',
});
// Auth link middleware to attach JWT token to requests
const authLink = setContext((_, { headers }) => {
    // Get the token from localStorage
    const token = localStorage.getItem('id_token');
    // Return the headers to the context
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    };
});
// Create Apollo Client with auth and cache
const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
});
function App() {
    return (<ApolloProvider client={client}>
      <Navbar />
      <Outlet />
    </ApolloProvider>);
}
export default App;
