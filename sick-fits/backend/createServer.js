const { GraphQLServer } = require('graphql-yoga');

const Query = require('./reslovers/Query');
const Mutation = require('./reslovers/Mutation');
const db = require('./db');

function createServer() {
  return new GraphQLServer({
    typeDefs: 'src/schema.graphql',
    resolvers: {
      Mutation,
      Query,
    },
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    context: req => ({ ...req, db}),
  });
}

module.exports = createServer;
