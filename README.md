# GraphQL-example

с REST несколькими способами:
Определить endpoint на сервере, который будет отдавать из базы данных пользователей с fname Maria.
Определить общий endpoint для получения всех пользователей и фильтровать полученный список на стороне клиента.
users.filter(user => user.fname === "Maria");
в каждом из вариантов есть свои минусы. Первый подход нельзя масштабировать, так как нет возможности создать endpoint для каждого пользователя. Если мы используем второй подход, повышается нагрузка на сеть, а также появляется необходимость в постобработке на стороне клиента.

инструмент, объединяет возможности SQL и REST на стороне клиента. с запроса GraphQL получить все необходимые данные.

Query: запросы в GraphQL
С помощью запросов GraphQL получает необходимые данные с сервера. Тип запроса Query в GraphQL — аналог GET в REST. Запросы — строки, которые отправляются в теле HTTP POST-запроса.

все типы запросов в GraphQL отправляются через POST.

Query описывает данные, которые необходимо получить с сервера. Например, с помощью кода ниже можно получить fname и age всех пользователей в базе данных.

query {
  users {
    fname
    age
  }
}

В ответ на этот запрос сервер присылает данные в формате JSON. Структура ответа соответствует структуре запроса.

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

Успешные операции возвращают JSON с ключом "data" и с ключом "error", а неуспешные возвращают JSON с ключом и сообщением об ошибке. Благодаря этому удобно обрабатывать ошибки на стороне клиента.

Mutation: мутации в GraphQL
Mutation — ещё один root types. добавлять данные в БД. Mutation — аналог POST и PUT в REST.

mutation createUser{
  addUser(fname: "Richie", age: 22) {
    id
  }
}
создаётся мутация createUser, которая добавляет в БД пользователя с fname Richie и age 22. В ответ на этот запрос сервер присылает JSON с id записи. Ответ выглядит так:

data : {
  addUser : "a36e4h"
}
Subscription: подписки в GraphQL
Subscription — третий тип операций в GraphQL. С его помощью клиент слушает изменения в БД в режиме реального времени. Под капотом подписки используют вебсокеты. Пример кода:

subscription listenLikes {
  listenLikes {
    fname
    likes
  }
}
получать список пользователей с именами и количеством лайков каждый раз, когда оно меняется.

когда пользователь с fname Richie получает лайк, ответ:

data: {
  listenLikes: {
    "fname": "Richie",
    "likes": 245
  }
}
запрос для обновления количества лайков в режиме реального времени в соответствующем интерфейсе, в форме с результатами голосования на сайте.

настроить сервер GraphQL, который отвечает на три типа запросов к БД NoSQL, в которой есть список пользователей с такой структурой:

[{
  "id": 1,
  "fname": "Richie",
  "age": 27,
  "likes": 8
},
{ 
  "id": 2,
  "fname": "Betty",
  "age": 20,
  "likes": 205
},
{ 
  "id" : 3,
  "fname": "Joe",
  "age": 28,
  "likes": 10
}]

в базе данных есть списки постов, которые опубликовали пользователи.

[{
  id: 1,
  userId: 2,
  body: "Hello how are you?"
},
{
  id: 1,
  userId: 3,
  body: "What's up?"
},
{
  id: 1,
  userId: 1,
  body: "Let's learn GraphQL"
}]

Данные в примере поместим в переменную JSON. В реальных проектах данные хранятся в БД. В тестовом проекте данные хранятся в index.js:

const users = [
  {
    id: 1,
    fname: 'Richie',
    age: 27,
    likes: 0,
  },
  {
    id: 2,
    fname: 'Betty',
    age: 20,
    likes: 205,
  },
  {
    id: 3,
    fname: 'Joe',
    age: 28,
    likes: 10,
  },
];

const posts = [
  {
    id: 1,
    userId: 2,
    body: "Hello how are you?"
  },
  {
    id: 1,
    userId: 3,
    body: "What's up?"
  },
  {
    id: 1,
    userId: 1,
    body: "Let's learn GraphQL"
  },
]

Работа с сервером GraphQL начинается с разработки схемы (Schema). Она состоит из двух взаимосвязанных объектов: TypeDefs и Resolvers.
типы необходимо определить. Объект typeDef определяет список типов, которые доступны в проекте:

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

определяется тип User, в котором указываются fname, age, likes и другие данные. Для каждого поля определяется тип данных: String или Int. GraphQL поддерживает четыре типа данных: String, Int, Float, Boolean. Если в поле указан восклицательный знак, оно становится обязательным.

определяются типы Query,Mutation и Subscription.

Первый тип, содержит внутри тип Query, users. Он принимает id и возвращает объект с данными соответствующего пользователя. Это обязательное поле. тип Query posts.

type Query {
  users(id: Int!): User!
  posts(id: Int!): Post!
}

Тип Mutation incrementLike. принимает параметр fname и возвращает список пользователей.

type Mutation {
  incrementLike(fname: String!) : [User!]
}

Тип Subscription listenLikes. возвращает список пользователей.

type Subscription {
  listenLikes : [User]
}

После определения типов добавить их логику. сервер знал, как отвечать на запросы клиента.
Resolver или распознаватель — функция, возвращает данные для определённого поля. Resolver’ы возвращают данные того типа, который определён в схеме. Распознаватели могут быть асинхронными. получать данные из REST API, базы данных.

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

В примере шесть функций:
запрос users возвращает объект пользователя, соответствующий переданному id;
запрос posts возвращает объект поста, соответствующий переданному id;
в поле posts User распознаватель принимает данные пользователя и возвращает список его постов;
в поле user Posts функция принимает данные поста и возвращает пользователя, который опубликовал пост;
мутация incrementLike изменяет объект users: увеличивает количество likes для пользователя с соответствующим fname. После этого users публикуются в pubsub с названием LIKES;
подписка listenLikes слушает LIKES и отвечает при обновлении pubsub.
pubsub инструмент - систему передачи информации в режиме реального времени с использованием вебсокетов. pubsub - всё, что касается вебсокетов, вынесено в отдельные абстракции.

REST vs. GraphQL
найти пользователя, который опубликовал пост с id x? как эта задача решается с помощью REST. данные:

Users:
{
  "id": 1,
  "fname": "Richie",
  "age": 27,
  "likes": 8
},
{ 
  "id": 2,
  "fname": "Betty",
  "age": 20,
  "likes": 205
},
{ 
  "id" : 3,
  "fname": "Joe",
  "age": 28,
  "likes": 10
}
Posts:
{
  id: 1,
  userId: 2,
  body: "Hello how are you?"
},
{
  id: 1,
  userId: 3,
  body: "What's up?"
},
{
  id: 1,
  userId: 1,
  body: "Let's learn GraphQL"
}

определить endpoint’ы GET:

> https://localhost:4000/users/:id
> https://localhost:4000/posts/:id

получить данные о пользователе, который опубликовал пост с id 1, запрос:

GET https://localhost:4000/posts/1
Response:
{
 id: 1,
 userId: 2,
 body: "Hello how are you?"
}

GET https://localhost:4000/users/2
Response:
{
 "id": 2,
 "fname": "Betty",
 "age": 20,
 "likes": 205
}

получить данные, дважды обращаться к серверу.
получить только имя пользователя? данные поля fname. уже получили дополнительные данные: id, likes, age. Операция слишком дорогой.

использовать endpoint, который получает только данные из поля fname:
https://localhost:4000/userByfname/:id
создавать endpoint для каждого типа информации. 

{
  posts(id: 1) {
    body
    user {
      fname
    }
  }
}

получить age пользователя, который опубликовал пост с id 1, запрос:

{
  posts(id: 1) {
    body
    user {
      age
    }
  }
}

Поле user в запросе определено в схеме. получать нужную информацию без использования endpoint’ов и повторных обращений к серверу.

``` bash
npm install
npm start
```

Example:

```
{
  posts(id: 1) {
    body
    user {
      fname
    }
  }
}
```
