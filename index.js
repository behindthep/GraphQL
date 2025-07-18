import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

// = gql`
const typeDefs = `#graphql
  type User {
    id: Int
    fname: String
    age: Int
    likes: Int
    posts: [Post]
  }

  type Post {
    id: Int
    user: User
    body: String
  }

  type Query {
    users(id: Int!): User!
    posts(id: Int!): Post!
  }

  type Mutation {
    incrementLike(fname: String!) : [User!]
  }

  type Subscription {
    listenLikes : [User]
  }
`;

const users = [
  { id: 1, fname: 'Richie', age: 27, likes: 0 },
  { id: 2, fname: 'Betty', age: 20, likes: 205 },
  { id: 3, fname: 'Joe', age: 28, likes: 10 },
];

const posts = [
  { id: 1, userId: 2, body: "Hello how are you?" },
  { id: 1, userId: 3, body: "What's up?" },
  { id: 1, userId: 1, body: "Let's learn GraphQL" },
]

// запрос users возвращает объект пользователя, соответствующий переданному id
const resolvers = {
  Query: {
    users(root, args) { return users.filter(user => user.id === args.id)[0] },
    posts(root, args) { return posts.filter(post => post.id === args.id)[0] }
  },

  // в поле posts User распознаватель принимает данные пользователя и возвращает список его постов
  User: {
    posts: (user) => {
      return posts.filter(post => post.userId === user.id)
    }
  },

  // в поле user Posts функция принимает данные поста и возвращает пользователя, который опубликовал пост
  Post: {
    user: (post) => {
      return users.filter(user => user.id === post.userId)[0]
    }
  },

  // мутация incrementLike изменяет объект users: увеличивает количество likes для пользователя с соответствующим fname. 
  // После этого users публикуются в pubsub с названием LIKES
  Mutation: {
    incrementLike(parent, args) {
      users.map((user) => {
        if(user.fname === args.fname) user.likes++
        return user
      })
      // pubsub - система передачи информации в режиме реального времени с использованием вебсокетов; всё, что касается вебсокетов, вынесено в отдельные абстракции.
      pubsub.publish('LIKES', {listenLikes: users});
      return users
    }
  },

  // подписка listenLikes слушает LIKES и отвечает при обновлении pubsub.
  Subscription: {
    listenLikes: {
      subscribe: () => pubsub.asyncIterator(['LIKES'])
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
