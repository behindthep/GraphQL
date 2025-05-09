# GraphQL-example

Sample GraphQL server implementation

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
