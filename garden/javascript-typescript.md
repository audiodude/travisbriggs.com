---
title: Javascript/Typescript
date: 2022-12-01
quality: Start
importance: Mid
---

Javascript is the most popular programming language in the world. It is the language used to write logic for web pages. Also, due to the V8 engine and Nodejs, Javascript can be used on the so-called "backend" as a server technology without a browser.

Typescript is a superset of Javascript that adds support for the computer science concept of "types". This means that instead of having a variable, and it being all loosey-goosey about what kind of data is in it:

```
var x = 'foo'
// Now it's a number!
x = 1
console.log(x + 'bar');
// prints "1bar", oops I forgot I put that number in there
```

Instead, you clearly define and declare what types of data go where. The coolest part of Typescript, in my opinion, is the fact that it is a _superset_ of Javascript. So all valid Javascript is valid Typescript. This allows you to transition to Typescript slowly, adding types here and there as you go, instead of having to convert a code project all at once. The downsides are that you have to use a _Typescript compiler_ to turn your code back into Javascript before you can do anything useful with it. Also, there's times where the types of certain data can be intentionally ambiguous, and there are firey hoops to jump through in those cases in order to get the compiler to "play nice". Overall, though, Typescript is great and I would strongly recommend it to any team of more than 1 person.
