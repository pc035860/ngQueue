# ngQueue

ngQueue is an AngularJS module that helps you to handle routine sync/async queue task in AngularJS with ease.

#### [Demo](http://plnkr.co/edit/qudYr8?p=preview)


## Getting started

Include the ngSelect module with AngularJS script in your page.

```html
<script src="//ajax.googleapis.com/ajax/libs/angularjs/1.1.5/angular.min.js"></script>
<script src="http://pc035860.github.io/ngQueue/ngQueue.min.js"></script>
```

Add `ngSelect` to your app module's dependency.

```js
angular.module('myApp', ['ngQueue']);
```

## Usage

### $queueFactory

Start with `$queueFactory` to create a queue you'll be working with.

```js
// create a queue with concurrent taslk quota of 2
var queue = $queueFactory(2);
```

Now you are ready to play with `Queue` instance APIs.

### Queue instance APIs

#### enqueue(fn, context, args)

Enqueue a `task(fn)` with specified `context(optional)` and `arguments(optional)`.

**The task can be either asynchronous or synchronous.**

Synchronous tasks work just like usual function call.

```js
//////////////////////
// synchronous task //
//////////////////////
queue.enqueue(function (inA, inB, inC) {

  console.log(this);  // {name: "context"}
  
  console.log(inA, inB, inC);  // hello world !
  
  doSomething();
  
}, {name: 'context'}, ['hello', 'world', '!']);
```

Return an [$q promise](http://code.angularjs.org/1.1.5/docs/api/ng.$q) in the task function to make it asynchronous.

```js
///////////////////////
// asynchronous task //
///////////////////////

// $timeout delay
queue.enqueue(function () {
  var dfd = $q.defer();

  $timeout(function () {
    dfd.resolve();
    // or dfd.reject()
  }, 100);

  return dfd.promise;
});

// $http request
queue.enqueue(function () {

  return $http.get('/some/api/call')
    .success(function () {
      // do something if success
    })
    .error(function () {
      // do something if error
    });

});
```

#### clear()

Clear the queue.

#### dequeue()

Try to dequeue manually. In most cases, the queue will handle all the dequeue works itself.
