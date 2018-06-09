/*jshint undef:true*/
/*global angular*/
angular.module('ngQueue', [])

.factory('$queueFactory', [
         '$q', '$window', '$timeout', '$rootScope', '$filter',
function ($q,   $window,   $timeout,   $rootScope,   $filter) {

  var Queue = function Queue(config) {
    this.init(config);
  };

  var p = Queue.prototype;

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
    this._config = config;
    this._limit = config.limit;
    this._queue = [];

    if (this._config.statistics) {
      this._list = [];
    }

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

    this._queue.push([todo, context, args]);

    if (this._config.statistics) {
      this.updateStats();
    }

    this.dequeue();
    return task;
  };

  p.remove = function (task) {
    var index = this._queue.indexOf(task),
    item = this._queue.splice(index, 1)[0];
    if (this._config.statistics) {
      this.updateStats();
    }
    return item;
  };

  p.dequeue = function () {
    if (this._limit <= 0 || this._queue.length === 0) {
      return;
    }

    this._limit--;

    var that = this,
        buf = this._queue.shift(),
        randNum = Math.random(),
        todo = buf[0],
        context = buf[1],
        args = buf[2],
        success, error;

    if (this._config.statistics) {
      this._list.push({ id: randNum, resolved: false });
    }

    success = error = function () {
      that._limit++;

      if (that._config.statistics) {
        var item = $filter('filter')(that._list, function (v) { return v.id === randNum; })[0];
        item.resolved = true;

        that.updateStats();
      }

      if (that._deferFunc) {
        that._deferFunc(function () {
          that.dequeue();
        });
      }
      else {
        that.dequeue();
      }
    };

    /*jshint es5: true */
    $q.when(todo.apply(context || null, args || null))
    .then(success, error);
    /*jshint es5: false */
  };

  p.clear = function () {
    this._queue = [];
    this._list = [];
    if (this._config.statistics) {
      this.updateStats();
    }
  };

  p.updateStats = function () {
    this.queueTotal = this._queue.length + this._list.length;
    this.queuePending = $filter('filter')(this._list, function (v) { return v.resolved === false; }).length + this._queue.length;
    this.queueIdle = this.queuePending < 1;
  };

  return function factory(limit, deferred) {
    var config;

    if (angular.isObject(limit)) {
      config = limit;
    }
    else {
      limit = limit || 1;

      if (angular.isObject(deferred)) {
        config = deferred;
        config.limit = config.limit || limit;
      }
      else {
        if (angular.isUndefined(deferred)) {
          deferred = false;
        }

        config = {
          limit: limit,
          deferred: !!deferred
        };
      }
    }

    return new Queue(config);
  };
}]);
