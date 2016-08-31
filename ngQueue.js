/*jshint undef:true*/
/*global angular*/
angular.module('ngQueue', [])

.factory('$queueFactory', [
         '$q', '$window', '$timeout', '$rootScope', '$filter',
function ($q,   $window,   $timeout,   $rootScope, $filter) {

  var Queue = function Queue(config) {
    this.init(config);
  };

  var p = Queue.prototype,
  updateStats = function () {
    p.queueTotal = p._queue.length + p._list.length;
    p.queuePending = $filter('filter')(p._list, {resolved:false}).length + p._queue.length;
    p.queueIdle = p.queuePending < 1;
  };

  p._config = {};

  // number of simultaneously runnable tasks
  p._limit = null;

  // the queue
  p._queue = [];

  // function used for deferring
  p._deferFunc = null;

  p._list = [];

  p.queueTotal = 0;
  p.queuePending = 0;
  p.queueIdle = true;


  p.init = function (config) {
    p._config = config;
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

    if (p._config.statistics) {
      updateStats();
    }

    p.dequeue();
    return task;
  };

  p.remove = function (task) {
    var index = p._queue.indexOf(task),
    item = p._queue.splice(index, 1)[0];
    if (p._config.statistics) {
      updateStats();
    }
    return item;
  };

  p.dequeue = function () {
    if (p._limit <= 0 || p._queue.length === 0) {
      return;
    }

    p._limit--;

    var buf = p._queue.shift(),
        timestamp = Math.random(),
        todo = buf[0],
        context = buf[1],
        args = buf[2],
        success, error, always;

    if (p._config.statistics) {
      p._list.push({id:timestamp,resolved:false});
    }

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
    always = function () {

      if (p._config.statistics) {
        var item = $filter('filter')(p._list, {id:timestamp})[0];
        item.resolved = true;

        updateStats();
      }

    };

    /*jshint es5: true */
    $q.when(todo.apply(context || null, args || null))
    .then(success, error).finally(always);
    /*jshint es5: false */
  };

  p.clear = function () {
    p._queue = [];
    p._list = [];
    if (p._config.statistics) {
      updateStats();
    }
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
