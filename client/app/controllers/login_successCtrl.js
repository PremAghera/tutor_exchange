(function(angular) {
  'use strict';

  angular
    .module('tutorExchange')
    .controller('LoginSuccessCtrl', LoginSuccessCtrl);


  LoginSuccessCtrl.$inject = ['$scope', 'session', 'authService', '$state', '$http'];
  function LoginSuccessCtrl($scope, session, authService, $state, $http) {
    $scope.user = {name: session.getUserName()};

    $scope.logout = function() {

      //authService.logout();
      $state.go('home');

      $http.get('/api/users?id=' + session.getUserId())
        .then(function(response) {
          console.log(response.data[0].name + ' has left the building');
          authService.logout();
        });

    };
  }

})(angular);
