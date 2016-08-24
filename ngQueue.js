/*jshint undef:true*/
/*global angular*/
angular.module('ngQueue', [])

.factory('$queueFactory', [
         '$q', '$window', '$timeout', '$rootScope',
function ($q,   $window,   $timeout,   $rootScope) {

  var Queue = function Queue(config) {
    this.init(config);
  };

  var p = Queue.prototype;

  // number of simultaneously runnable tasks
  p._limit = null;

  // the queue
  p._queue = [];

  // function used for deferring
  p._deferFunc = null;

  p.init = function (config) {
    p._limit = config.limit;
    p._queue = [];

    if (config.deferred) {
      if ($window.setImmediate) {
        this._deferFunc = function (todo) {
          $window.setImmediate(function () {
            todo();
            $rootScope.$apply();
          });
        };
      }
      else {
        this._deferFunc = function (todo) {
          // $timeout(todo, 0, true);
          $timeout(todo);
        };
      }
    }
  };

  p.enqueue = function (todo, context, args) {
    var task = [todo, context, args];

    p._queue.push([todo, context, args]);

    p.dequeue();
    return task;
  };

  p.remove = function (task) {
    var index = p._queue.indexOf(task),
    item = p._queue.splice(index, 1)[0];
    return item;
  };

  p.dequeue = function () {
    if (p._limit <= 0 || p._queue.length === 0) {
      return;
    }

    p._limit--;

    var buf = p._queue.shift(),
        todo = buf[0],
        context = buf[1],
        args = buf[2],
        success, error;

    success = error = function () {
      p._limit++;


      if (p._deferFunc) {
        p._deferFunc(function () {
          p.dequeue();
        });
      }
      else {
        p.dequeue();
      }
    };

    $q.when(todo.apply(context || null, args || null))
    .then(success, error);
  };

  p.clear = function () {
    p._queue = [];
  };

  return function factory(limit, deferred) {
    var config;

    if (angular.isObject(limit)) {
      config = limit;
    }
    else {
      limit = limit || 1;

      if (angular.isUndefined(deferred)) {
        deferred = false;
      }
      config = {
        limit: limit,
        deferred: !!deferred
      };
    }

    return new Queue(config);
  };
}]);
