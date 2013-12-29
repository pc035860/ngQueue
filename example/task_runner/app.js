var app = angular.module('plunker', ['ngQueue']);

app.directive('uiCountdown', function($window, $timeout) {
  return {
    restrict: 'EA',
    scope: {
      startFrom: "@uiCountdown"
    },
    link: function postLink(scope, iElm, iAttrs) {
      var _requestAnimFrame = (function(){
              return  $window.requestAnimationFrame       ||
                      $window.webkitRequestAnimationFrame ||
                      $window.mozRequestAnimationFrame    ||
                      function( callback ){
                        $window.setTimeout(callback, 1000 / 60);
                      };
            })(),
          _start,
          _counter;

      scope.$watch('startFrom', function (val) {

        if (angular.isDefined(val)) {
          _start = _now();
          _tick();
        }
        
      });

      function _now () {
        return (new Date()).getTime();
      }

      function _tick () {
        var diff = _now() - _start,
            result = Math.max(0, scope.startFrom - diff);

        iElm.text(result >>> 0);

        if (result > 0) {
          _requestAnimFrame(_tick);
        }
      }
    }
  };
});

app.controller('MainCtrl', function($scope, $queueFactory, $q, $timeout) {
  
  var _taskId = 1,
      // two concurrent tasks available
      _queue = $queueFactory(2);
  
  // view queue for demostration
  $scope.vq = [];
  
  $scope.queueSync = function () {
    
    var taskId = _taskId++, 
        obj = [taskId, 'sync'];
    
    $scope.vq.push(obj);
    _queue.enqueue(function (vqObj) {
      _removeFromVQ(vqObj);
    }, null, [obj]);
    
  };
  
  $scope.queueAsync = function () {
    
    var taskId = _taskId++, 
        duration = (Math.random() * 500 + 600) >>> 0,
        obj = [taskId, 'async', duration];
    
    $scope.vq.push(obj);
    _queue.enqueue(function (vqObj) {
      
      var dfd = $q.defer();
      
      $timeout(function () {
        _removeFromVQ(vqObj);
        dfd.resolve();
      }, duration);
      
      // start countdown
      vqObj.push(true);
      
      return dfd.promise;
      
    }, null, [obj]);
  };
  
  $scope.queueRandom = function (itrCount) {

    for (var i = 0; i < itrCount; i++) {
      if (Math.random() >= 0.5) {
        $scope.queueAsync();
      }
      else {
        $scope.queueSync();
      }
    }
  };
  
  // start with 30 random tasks
  $scope.queueRandom(30);
  
  function _removeFromVQ(obj) {
    $scope.vq.splice($scope.vq.indexOf(obj), 1);
  }
});
