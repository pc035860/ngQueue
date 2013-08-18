angular.module('ngQueue', [])

.factory('$queueFactory', [
         '$q',
function ($q) {

  var Queue = function Queue(config) {
    this.init(config);
  };

  var p = Queue.prototype;

  // number of simultaneously runnable tasks
  p._limit = null;

  // the queue
  p._queue = null;

  p.init = function (config) {
    this._limit = config.limit;
    this._queue = [];
  };

  p.enqueue = function (todo, context, args) {
    this._queue.push([todo, context, args]);

    this.dequeue();
  };

  p.dequeue = function () {
    if (this._limit <= 0 || this._queue.length === 0) {
      return;
    }

    this._limit--;

    var buf = this._queue.shift(),
        todo = buf[0],
        context = buf[1],
        args = buf[2],
        success, error;

    var that = this;
    success = error = function () {
      that._limit++;
      that.dequeue();
    };

    $q.when(todo.apply(context || null, args || null))
    .then(success, error);
  };

  p.clear = function () {
    this._queue.length = 0;
  };

  return function factory(limit) {
    limit = limit || 1;
    return new Queue({
        limit: limit
      });
  };
}]);
