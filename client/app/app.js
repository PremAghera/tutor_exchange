(function(angular) {
  'use strict';

  angular
    .module('tutorExchange', [
      'ui.bootstrap',
      'ngAnimate',
      'ui.router',
      'ui.select',
      'ngMessages',
    ])
    .config(config)
    .run(run);


  config.$inject = ['$urlRouterProvider', '$stateProvider', 'USER_ROLES'];
  function config($urlRouterProvider, $stateProvider, USER_ROLES) {
    $urlRouterProvider
      .otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/templates/home.html',
      })

      .state('login', {
        url: '/login',
        templateUrl: 'app/templates/login.html',
        controller: 'LoginCtrl',
      })

      .state('dashboard', {
        url: '/dashboard',
        templateUrl: 'app/templates/dashboard.html',
        controller: 'DashboardCtrl',
        data: {
          authRequired: true,
          authRoles:    [USER_ROLES.all],
        },
      })

      .state('profile', {
        url: '/profile',
        templateUrl: 'app/templates/profile.html',
        controller: 'ProfileCtrl',
        data: {
          authRequired: true,
          authRoles:    [USER_ROLES.all],
        },
      })

      .state('apply', {
        url: '/apply',
        templateUrl: 'app/templates/apply.html',
        controller: 'ApplyCtrl',
      });
  }

  run.$inject = ['$rootScope', 'authService', 'USER_ROLES', '$state'];
  function run($rootScope, authService, USER_ROLES, $state) {
    $rootScope.$on('$stateChangeStart', function(event, next) {
      if (next.data && next.data.authRequired) {
        if (!authService.isAuthenticated()) {
          //console.log('YOU NEED TO LOG IN');
          event.preventDefault();
          $state.go('login');
        } else if (next.data.authRoles && !authService.isAuthorised(next.data.authRoles)) {
          //console.log('YOU ARE NOT AUTHORISED TO SEE THAT PAGE');
          event.preventDefault();
        }
      }
    });
  }

})(angular);
