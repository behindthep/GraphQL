# GraphQL

``` bash
npm install
npm start
```

---

### Query 
Аналог GET в REST. Запросы — строки, которые отправляются в теле HTTP POST-запроса. Все типы запросов в GraphQL отправляются через POST.

```
query {
  users {
    fname
    age
  }
}
```

```
data : {
  users [
    {
      "fname": "Joe",
      "age": 23
    },
    {
      "fname": "Betty",
      "age": 29
    }
  ]
}
```

Успешные операции возвращают JSON с ключом "data" и с ключом "error", а неуспешные JSON с ключом и сообщением об ошибке.


### Mutation 
Аналог POST и PUT в REST.

```
mutation createUser{
  addUser(fname: "Richie", age: 22) {
    id
  }
}
```

В ответ на этот запрос сервер присылает JSON с id записи:

```
data : {
  addUser : "a36e4h"
}
```


### Subscription 
Клиент слушает изменения в БД в режиме реального времени. Под капотом подписки используют вебсокеты.
Получать список пользователей с именами и количеством лайков каждый раз, когда оно меняется.

```
subscription listenLikes {
  listenLikes {
    fname
    likes
  }
}
```

Когда пользователь с fname Richie получает лайк, ответ:

```
data: {
  listenLikes: {
    "fname": "Richie",
    "likes": 245
  }
}
```

---

Сервер GraphQL, который отвечает на три типа запросов к БД NoSQL, в которой есть список пользователей, списки постов, которые опубликовали пользователи.

Работа с сервером GraphQL начинается с разработки схемы (Schema). Она состоит из двух взаимосвязанных объектов: TypeDefs и Resolvers. Объект typeDef определяет список типов, которые доступны в проекте:

```
const typeDefs = gql`
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
```

Если в поле указан восклицательный знак, оно становится обязательным.

После определения типов добавить их логику. Cервер знал, как отвечать на запросы клиента.
Resolver или распознаватель — функция, возвращает данные для определённого поля. Resolver’ы возвращают данные того типа, который определён в схеме.

```
const resolvers = {
  Query: {
    users(root, args) { return users.filter(user => user.id === args.id)[0] },
    posts(root, args) { return posts.filter(post => post.id === args.id)[0] }
  },

  User: {
    posts: (user) => {
      return posts.filter(post => post.userId === user.id)
    }
  },

  Post: {
    user: (post) => {
      return users.filter(user => user.id === post.userId)[0]
    }
  },

  Mutation: {
    incrementLike(parent, args) {
      users.map((user) => {
        if(user.fname === args.fname) user.likes++
        return user
      })
      pubsub.publish('LIKES', {listenLikes: users});
      return users
    }
  },

  Subscription: {
    listenLikes: {
      subscribe: () => pubsub.asyncIterator(['LIKES'])
    }
  }
};
```

В примере шесть функций:
- запрос users возвращает объект пользователя, соответствующий переданному id;
- запрос posts возвращает объект поста, соответствующий переданному id;
- в поле posts User распознаватель принимает данные пользователя и возвращает список его постов;
- в поле user Posts функция принимает данные поста и возвращает пользователя, который опубликовал пост;
- мутация incrementLike изменяет объект users: увеличивает количество likes для пользователя с соответствующим fname. После этого users публикуются в pubsub с названием LIKES;
- подписка listenLikes слушает LIKES и отвечает при обновлении pubsub.


pubsub инструмент - систему передачи информации в режиме реального времени с использованием вебсокетов. pubsub - всё, что касается вебсокетов, вынесено в отдельные абстракции.


Поле user в запросе определено в схеме. получать нужную информацию без использования endpoint’ов и повторных обращений к серверу.
получить age пользователя, который опубликовал пост с id 1, запрос:

```
{
  posts(id: 1) {
    body
    user {
      age
    }
  }
}
```
